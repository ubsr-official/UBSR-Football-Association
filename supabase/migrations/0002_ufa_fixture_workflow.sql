create or replace function public.submit_manager_days(target_window uuid, selected_days date[])
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  target_team uuid := public.current_team_id();
  window_record public.fixture_windows;
begin
  select * into window_record from public.fixture_windows where id = target_window for update;
  if not found then raise exception 'Fixture window not found'; end if;
  if target_team is null or target_team not in (window_record.home_team_id, window_record.away_team_id) then raise exception 'Only a participating manager can submit days'; end if;
  if window_record.status not in ('draft', 'collecting_days', 'reviewing') then raise exception 'This fixture window is no longer accepting day submissions'; end if;
  if exists(select 1 from unnest(selected_days) as day_value where day_value < window_record.start_day or day_value > window_record.end_day) then raise exception 'Every selected day must fall within the administrator-defined window'; end if;
  if exists(select 1 from public.fixture_proposals where fixture_window_id = target_window and status in ('accepted_by_home', 'accepted_by_away', 'ready_for_admin', 'published')) then raise exception 'Days cannot change after a manager has accepted a proposal'; end if;

  delete from public.manager_day_availability where fixture_window_id = target_window and team_id = target_team;
  insert into public.manager_day_availability(fixture_window_id, team_id, available_day, submitted_by)
  select target_window, target_team, distinct_day, auth.uid() from unnest(selected_days) as distinct_day
  on conflict (fixture_window_id, team_id, available_day) do nothing;

  insert into public.fixture_proposals(fixture_window_id, proposed_day)
  select target_window, available_day
  from public.manager_day_availability
  where fixture_window_id = target_window
  group by available_day
  having count(distinct team_id) = 2
  on conflict (fixture_window_id, proposed_day) do nothing;

  update public.fixture_windows
  set status = case when exists(select 1 from public.fixture_proposals where fixture_window_id = target_window) then 'reviewing' else 'collecting_days' end,
      updated_at = now()
  where id = target_window;

  insert into public.audit_events(actor_id, action, entity_type, entity_id, detail)
  values (auth.uid(), 'availability_submitted', 'fixture_window', target_window, 'A participating manager submitted day-only availability.');
end;
$$;

create or replace function public.accept_fixture_proposal(target_proposal uuid, accepted boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  proposal_record public.fixture_proposals;
  window_record public.fixture_windows;
  target_team uuid := public.current_team_id();
  next_home timestamptz;
  next_away timestamptz;
begin
  select * into proposal_record from public.fixture_proposals where id = target_proposal for update;
  if not found then raise exception 'Fixture proposal not found'; end if;
  select * into window_record from public.fixture_windows where id = proposal_record.fixture_window_id;
  if target_team is null or target_team not in (window_record.home_team_id, window_record.away_team_id) then raise exception 'Only a participating manager can respond to this proposal'; end if;
  if proposal_record.status in ('published', 'rejected', 'withdrawn') then raise exception 'This proposal is no longer actionable'; end if;
  if not accepted then
    update public.fixture_proposals set status = 'rejected', updated_at = now() where id = target_proposal;
    insert into public.audit_events(actor_id, action, entity_type, entity_id, detail) values (auth.uid(), 'fixture_day_rejected', 'fixture_proposal', target_proposal, 'A participating manager rejected the proposed match day.');
    return;
  end if;
  next_home := case when target_team = window_record.home_team_id then now() else proposal_record.home_accepted_at end;
  next_away := case when target_team = window_record.away_team_id then now() else proposal_record.away_accepted_at end;
  update public.fixture_proposals
  set home_accepted_at = next_home,
      away_accepted_at = next_away,
      status = case when next_home is not null and next_away is not null then 'ready_for_admin' when next_home is not null then 'accepted_by_home' else 'accepted_by_away' end,
      updated_at = now()
  where id = target_proposal;
  insert into public.audit_events(actor_id, action, entity_type, entity_id, detail) values (auth.uid(), 'fixture_day_accepted', 'fixture_proposal', target_proposal, 'A participating manager accepted the proposed match day.');
end;
$$;

create or replace function public.publish_fixture_proposal(target_proposal uuid, classification public.fixture_class)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  proposal_record public.fixture_proposals;
  window_record public.fixture_windows;
  fixture_id uuid;
begin
  if not public.is_league_admin() then raise exception 'Only the owner or Arish may publish a fixture'; end if;
  select * into proposal_record from public.fixture_proposals where id = target_proposal for update;
  if not found or proposal_record.status <> 'ready_for_admin' then raise exception 'Both managers must accept before publication'; end if;
  select * into window_record from public.fixture_windows where id = proposal_record.fixture_window_id for update;
  insert into public.fixtures(fixture_window_id, proposal_id, home_team_id, away_team_id, match_day, competition_class)
  values (window_record.id, proposal_record.id, window_record.home_team_id, window_record.away_team_id, proposal_record.proposed_day, classification)
  returning id into fixture_id;
  update public.fixture_proposals set status = 'published', published_by = auth.uid(), published_at = now(), updated_at = now() where id = target_proposal;
  update public.fixture_windows set status = 'published', published_by = auth.uid(), updated_at = now() where id = window_record.id;
  insert into public.league_activity(category, headline, detail, actor_id) values ('fixture', 'Fixture published', 'A manager-agreed match day was approved and published by an administrator.', auth.uid());
  insert into public.audit_events(actor_id, action, entity_type, entity_id, detail) values (auth.uid(), 'fixture_published', 'fixture', fixture_id, 'Administrator published a manager-agreed match day.');
  return fixture_id;
end;
$$;

create or replace function public.confirm_fixture_result(target_fixture uuid, home_goals integer, away_goals integer, nominated_player_of_match uuid, note text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_league_admin() then raise exception 'Only the owner or Arish may confirm a result'; end if;
  if home_goals < 0 or away_goals < 0 then raise exception 'Scores cannot be negative'; end if;
  update public.fixtures
  set status = 'completed', home_score = home_goals, away_score = away_goals, player_of_match_member_id = nominated_player_of_match,
      committee_note = note, result_confirmed_by = auth.uid(), result_confirmed_at = now(), updated_at = now()
  where id = target_fixture;
  if not found then raise exception 'Fixture not found'; end if;
  insert into public.league_activity(category, headline, detail, actor_id) values ('result', 'Match result confirmed', 'An administrator confirmed a match result and updated the live league record.', auth.uid());
  insert into public.audit_events(actor_id, action, entity_type, entity_id, detail) values (auth.uid(), 'result_confirmed', 'fixture', target_fixture, 'Administrator confirmed the match result.');
end;
$$;

grant execute on function public.submit_manager_days(uuid, date[]) to authenticated;
grant execute on function public.accept_fixture_proposal(uuid, boolean) to authenticated;
grant execute on function public.publish_fixture_proposal(uuid, public.fixture_class) to authenticated;
grant execute on function public.confirm_fixture_result(uuid, integer, integer, uuid, text) to authenticated;
