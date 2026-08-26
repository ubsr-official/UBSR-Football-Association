revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_league_admin() from public, anon, authenticated;
revoke all on function public.current_member_id() from public, anon, authenticated;
revoke all on function public.current_team_id() from public, anon, authenticated;
revoke all on function public.can_view_league() from public, anon, authenticated;
revoke all on function public.is_team_manager(uuid) from public, anon, authenticated;
revoke all on function public.is_fixture_party(uuid) from public, anon, authenticated;
revoke all on function public.recalculate_team_balance(uuid) from public, anon, authenticated;

revoke all on function public.submit_manager_days(uuid, date[]) from public, anon;
revoke all on function public.accept_fixture_proposal(uuid, boolean) from public, anon;
revoke all on function public.publish_fixture_proposal(uuid, public.fixture_class) from public, anon;
revoke all on function public.confirm_fixture_result(uuid, integer, integer, uuid, text) from public, anon;
revoke all on function public.set_market_approval(boolean) from public, anon;
revoke all on function public.create_trade_listing(uuid, integer) from public, anon;
revoke all on function public.place_trade_offer(uuid, integer, text) from public, anon;
revoke all on function public.resolve_trade_offer(uuid, boolean) from public, anon;
revoke all on function public.post_trade_message(uuid, text) from public, anon;

grant execute on function public.submit_manager_days(uuid, date[]) to authenticated;
grant execute on function public.accept_fixture_proposal(uuid, boolean) to authenticated;
grant execute on function public.publish_fixture_proposal(uuid, public.fixture_class) to authenticated;
grant execute on function public.confirm_fixture_result(uuid, integer, integer, uuid, text) to authenticated;
grant execute on function public.set_market_approval(boolean) to authenticated;
grant execute on function public.create_trade_listing(uuid, integer) to authenticated;
grant execute on function public.place_trade_offer(uuid, integer, text) to authenticated;
grant execute on function public.resolve_trade_offer(uuid, boolean) to authenticated;
grant execute on function public.post_trade_message(uuid, text) to authenticated;
grant execute on function public.recalculate_team_balance(uuid) to service_role;
