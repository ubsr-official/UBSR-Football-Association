create or replace function public.set_market_approval(enabled boolean)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  seat_name text;
  market_record public.market_settings;
begin
  select seat into seat_name from public.admin_seats where user_id = auth.uid();
  if seat_name is null then raise exception 'Only the owner or Arish may change market approval'; end if;
  select * into market_record from public.market_settings where id = 1 for update;
  update public.market_settings
  set owner_enabled = case when seat_name = 'owner' then enabled else market_record.owner_enabled end,
      arish_enabled = case when seat_name = 'arish' then enabled else market_record.arish_enabled end,
      is_open = case when seat_name = 'owner' then enabled and market_record.arish_enabled else market_record.owner_enabled and enabled end,
      updated_at = now()
  where id = 1;
  insert into public.audit_events(actor_id, action, entity_type, entity_id, detail) values (auth.uid(), 'market_approval_changed', 'market_settings', null, 'An administrator independently updated market approval.');
  return (select is_open from public.market_settings where id = 1);
end;
$$;

create or replace function public.create_trade_listing(target_player uuid, price integer)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  target_team uuid := public.current_team_id();
  thread_id uuid;
begin
  if not (select is_open from public.market_settings where id = 1) then raise exception 'The transfer market is closed'; end if;
  if target_team is null then raise exception 'Only a manager can publish a listing'; end if;
  if not exists(select 1 from public.roster_entries where team_id = target_team and player_member_id = target_player) then raise exception 'You can only list a player on your own roster'; end if;
  if price < 0 then raise exception 'Base price cannot be negative'; end if;
  insert into public.public_trade_threads(player_member_id, seller_team_id, base_price) values (target_player, target_team, price) returning id into thread_id;
  insert into public.audit_events(actor_id, action, entity_type, entity_id, detail) values (auth.uid(), 'trade_listing_created', 'trade_thread', thread_id, format('Seller listed a rostered player at %s points.', price));
  return thread_id;
end;
$$;

create or replace function public.place_trade_offer(target_thread uuid, bid integer, note text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  buyer_team uuid := public.current_team_id();
  thread_record public.public_trade_threads;
  offer_id uuid;
begin
  if not (select is_open from public.market_settings where id = 1) then raise exception 'The transfer market is closed'; end if;
  if buyer_team is null then raise exception 'Only a manager can make an offer'; end if;
  select * into thread_record from public.public_trade_threads where id = target_thread for update;
  if not found or thread_record.status <> 'open' then raise exception 'This listing is no longer open'; end if;
  if buyer_team = thread_record.seller_team_id then raise exception 'A manager cannot bid on their own listing'; end if;
  if bid < 0 then raise exception 'Bid cannot be negative'; end if;
  insert into public.public_trade_offers(thread_id, buyer_team_id, bid_points, negotiation_note) values (target_thread, buyer_team, bid, note) returning id into offer_id;
  insert into public.audit_events(actor_id, action, entity_type, entity_id, detail) values (auth.uid(), 'trade_offer_placed', 'trade_thread', target_thread, format('A manager placed a %s point offer.', bid));
  return offer_id;
end;
$$;

create or replace function public.resolve_trade_offer(target_offer uuid, accepted boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  seller_team uuid := public.current_team_id();
  offer_record public.public_trade_offers;
  thread_record public.public_trade_threads;
begin
  if not (select is_open from public.market_settings where id = 1) then raise exception 'The transfer market is closed'; end if;
  select * into offer_record from public.public_trade_offers where id = target_offer for update;
  if not found or offer_record.status <> 'pending' then raise exception 'This offer is no longer actionable'; end if;
  select * into thread_record from public.public_trade_threads where id = offer_record.thread_id for update;
  if seller_team is null or seller_team <> thread_record.seller_team_id then raise exception 'Only the seller can accept or reject this offer'; end if;
  if not accepted then
    update public.public_trade_offers set status = 'rejected', resolved_at = now() where id = target_offer;
    insert into public.audit_events(actor_id, action, entity_type, entity_id, detail) values (auth.uid(), 'trade_offer_rejected', 'trade_thread', thread_record.id, 'The seller rejected a manual trade offer.');
    return;
  end if;
  if (select current_balance from public.teams where id = offer_record.buyer_team_id) < offer_record.bid_points then raise exception 'The buyer no longer has sufficient balance'; end if;
  update public.roster_entries set team_id = offer_record.buyer_team_id, acquired_price = offer_record.bid_points, source = 'trade', acquired_at = now()
  where team_id = seller_team and player_member_id = thread_record.player_member_id;
  if not found then raise exception 'Listed player is no longer on the seller roster'; end if;
  update public.public_trade_offers set status = case when id = target_offer then 'accepted' else 'rejected' end, resolved_at = now() where thread_id = thread_record.id and status = 'pending';
  update public.public_trade_threads set status = 'accepted', resolved_at = now(), updated_at = now() where id = thread_record.id;
  perform public.recalculate_team_balance(seller_team);
  perform public.recalculate_team_balance(offer_record.buyer_team_id);
  insert into public.league_activity(category, headline, detail, actor_id) values ('market', 'Trade accepted', 'A seller manually accepted a public trade offer.', auth.uid());
  insert into public.audit_events(actor_id, action, entity_type, entity_id, detail) values (auth.uid(), 'trade_offer_accepted', 'trade_thread', thread_record.id, format('Seller accepted a %s point offer; roster and balances updated.', offer_record.bid_points));
end;
$$;

create or replace function public.post_trade_message(target_thread uuid, message_body text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare message_id uuid;
begin
  if not (select is_open from public.market_settings where id = 1) then raise exception 'The transfer market is closed'; end if;
  if public.current_member_id() is null and not public.is_league_admin() then raise exception 'Only league accounts can post'; end if;
  insert into public.public_trade_messages(thread_id, author_id, body) values (target_thread, auth.uid(), message_body) returning id into message_id;
  insert into public.audit_events(actor_id, action, entity_type, entity_id, detail) values (auth.uid(), 'trade_message_posted', 'trade_thread', target_thread, 'A public trade negotiation message was posted.');
  return message_id;
end;
$$;

grant execute on function public.set_market_approval(boolean) to authenticated;
grant execute on function public.create_trade_listing(uuid, integer) to authenticated;
grant execute on function public.place_trade_offer(uuid, integer, text) to authenticated;
grant execute on function public.resolve_trade_offer(uuid, boolean) to authenticated;
grant execute on function public.post_trade_message(uuid, text) to authenticated;
