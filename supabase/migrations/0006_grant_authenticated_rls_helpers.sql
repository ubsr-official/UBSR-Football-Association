grant execute on function public.is_league_admin() to authenticated;
grant execute on function public.current_member_id() to authenticated;
grant execute on function public.current_team_id() to authenticated;
grant execute on function public.can_view_league() to authenticated;
grant execute on function public.is_team_manager(uuid) to authenticated;
grant execute on function public.is_fixture_party(uuid) to authenticated;
