begin;

create table if not exists public.auction_log_entries (
  id uuid primary key default gen_random_uuid(),
  auction_round text not null,
  player_member_id uuid not null references public.league_members(id) on delete restrict,
  player_code_snapshot text not null,
  player_name_snapshot text not null,
  section_snapshot text,
  positions_snapshot text,
  base_price integer not null check (base_price >= 0),
  final_bought_price integer not null check (final_bought_price >= 0),
  buyer_team_id uuid not null references public.teams(id) on delete restrict,
  buyer_manager_snapshot text not null,
  outcome text not null default 'sold' check (outcome = 'sold'),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (auction_round, player_member_id)
);

create index if not exists auction_log_round_idx on public.auction_log_entries(auction_round, created_at);
create index if not exists auction_log_buyer_idx on public.auction_log_entries(buyer_team_id);

create or replace function public.prevent_auction_log_mutation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  raise exception 'Finalized auction log entries are immutable';
end;
$$;

drop trigger if exists auction_log_entries_immutable on public.auction_log_entries;
create trigger auction_log_entries_immutable
before update or delete on public.auction_log_entries
for each row execute function public.prevent_auction_log_mutation();

alter table public.auction_log_entries enable row level security;
drop policy if exists auction_log_public_read on public.auction_log_entries;
create policy auction_log_public_read on public.auction_log_entries for select using (true);
drop policy if exists auction_log_no_public_insert on public.auction_log_entries;
create policy auction_log_no_public_insert on public.auction_log_entries for insert with check (public.is_league_admin());
drop policy if exists auction_log_no_public_update on public.auction_log_entries;
create policy auction_log_no_public_update on public.auction_log_entries for update using (false);
drop policy if exists auction_log_no_public_delete on public.auction_log_entries;
create policy auction_log_no_public_delete on public.auction_log_entries for delete using (false);

with final_auction(player_code, manager_code, final_price) as (
values
  ('UBSR-001', 'UBSR-024', 550),
  ('UBSR-040', 'UBSR-024', 580),
  ('UBSR-048', 'UBSR-024', 500),
  ('UBSR-049', 'UBSR-024', 125),
  ('UBSR-053', 'UBSR-024', 15),
  ('UBSR-005', 'UBSR-032', 375),
  ('UBSR-045', 'UBSR-032', 555),
  ('UBSR-041', 'UBSR-032', 575),
  ('UBSR-007', 'UBSR-032', 465),
  ('UBSR-035', 'UBSR-032', 30),
  ('UBSR-052', 'UBSR-006', 75),
  ('UBSR-050', 'UBSR-006', 705),
  ('UBSR-012', 'UBSR-006', 500),
  ('UBSR-004', 'UBSR-006', 255),
  ('UBSR-036', 'UBSR-006', 70),
  ('UBSR-030', 'UBSR-034', 400),
  ('UBSR-025', 'UBSR-034', 375),
  ('UBSR-044', 'UBSR-034', 720),
  ('UBSR-043', 'UBSR-034', 175),
  ('UBSR-013', 'UBSR-034', 15),
  ('UBSR-026', 'UBSR-028', 725),
  ('UBSR-046', 'UBSR-028', 125),
  ('UBSR-051', 'UBSR-028', 725),
  ('UBSR-016', 'UBSR-028', 150),
  ('UBSR-056', 'UBSR-028', 160),
  ('UBSR-017', 'UBSR-031', 175),
  ('UBSR-019', 'UBSR-031', 635),
  ('UBSR-033', 'UBSR-031', 960),
  ('UBSR-027', 'UBSR-031', 110),
  ('UBSR-037', 'UBSR-031', 15),
  ('UBSR-015', 'UBSR-029', 450),
  ('UBSR-008', 'UBSR-029', 350),
  ('UBSR-055', 'UBSR-029', 375),
  ('UBSR-054', 'UBSR-029', 570),
  ('UBSR-011', 'UBSR-029', 200),
  ('UBSR-021', 'UBSR-022', 625),
  ('UBSR-023', 'UBSR-022', 425),
  ('UBSR-020', 'UBSR-022', 695),
  ('UBSR-042', 'UBSR-022', 75),
  ('UBSR-003', 'UBSR-022', 50),
  ('UBSR-039', 'UBSR-047', 895),
  ('UBSR-038', 'UBSR-047', 625),
  ('UBSR-009', 'UBSR-047', 305),
  ('UBSR-002', 'UBSR-047', 20),
  ('UBSR-018', 'UBSR-047', 125)
), resolved as (
  select player.id as player_member_id, player.member_code, player.full_name, player.section, player.positions,
    player.base_price, final_auction.final_price, team.id as buyer_team_id,
    manager.full_name as buyer_manager_snapshot
  from final_auction
  join public.league_members player on player.member_code = final_auction.player_code
  join public.league_members manager on manager.member_code = final_auction.manager_code
  join public.teams team on team.manager_member_id = manager.id
)
insert into public.auction_log_entries(
  auction_round, player_member_id, player_code_snapshot, player_name_snapshot, section_snapshot,
  positions_snapshot, base_price, final_bought_price, buyer_team_id, buyer_manager_snapshot, outcome
)
select 'Round 2 Complete', player_member_id, member_code, full_name, section, positions,
  base_price, final_price, buyer_team_id, buyer_manager_snapshot, 'sold'
from resolved
on conflict (auction_round, player_member_id) do nothing;

with final_auction(player_code, manager_code, final_price) as (
values
  ('UBSR-001', 'UBSR-024', 550), ('UBSR-040', 'UBSR-024', 580), ('UBSR-048', 'UBSR-024', 500), ('UBSR-049', 'UBSR-024', 125), ('UBSR-053', 'UBSR-024', 15),
  ('UBSR-005', 'UBSR-032', 375), ('UBSR-045', 'UBSR-032', 555), ('UBSR-041', 'UBSR-032', 575), ('UBSR-007', 'UBSR-032', 465), ('UBSR-035', 'UBSR-032', 30),
  ('UBSR-052', 'UBSR-006', 75), ('UBSR-050', 'UBSR-006', 705), ('UBSR-012', 'UBSR-006', 500), ('UBSR-004', 'UBSR-006', 255), ('UBSR-036', 'UBSR-006', 70),
  ('UBSR-030', 'UBSR-034', 400), ('UBSR-025', 'UBSR-034', 375), ('UBSR-044', 'UBSR-034', 720), ('UBSR-043', 'UBSR-034', 175), ('UBSR-013', 'UBSR-034', 15),
  ('UBSR-026', 'UBSR-028', 725), ('UBSR-046', 'UBSR-028', 125), ('UBSR-051', 'UBSR-028', 725), ('UBSR-016', 'UBSR-028', 150), ('UBSR-056', 'UBSR-028', 160),
  ('UBSR-017', 'UBSR-031', 175), ('UBSR-019', 'UBSR-031', 635), ('UBSR-033', 'UBSR-031', 960), ('UBSR-027', 'UBSR-031', 110), ('UBSR-037', 'UBSR-031', 15),
  ('UBSR-015', 'UBSR-029', 450), ('UBSR-008', 'UBSR-029', 350), ('UBSR-055', 'UBSR-029', 375), ('UBSR-054', 'UBSR-029', 570), ('UBSR-011', 'UBSR-029', 200),
  ('UBSR-021', 'UBSR-022', 625), ('UBSR-023', 'UBSR-022', 425), ('UBSR-020', 'UBSR-022', 695), ('UBSR-042', 'UBSR-022', 75), ('UBSR-003', 'UBSR-022', 50),
  ('UBSR-039', 'UBSR-047', 895), ('UBSR-038', 'UBSR-047', 625), ('UBSR-009', 'UBSR-047', 305), ('UBSR-002', 'UBSR-047', 20), ('UBSR-018', 'UBSR-047', 125)
)
insert into public.auction_records(player_member_id, base_price, final_bought_price, status, buyer_team_id, resolved_at, note)
select player.id, player.base_price, final_auction.final_price, 'sold'::public.auction_status, team.id, now(), 'Finalized Round 2 auction; historical log stored separately.'
from final_auction
join public.league_members player on player.member_code = final_auction.player_code
join public.league_members manager on manager.member_code = final_auction.manager_code
join public.teams team on team.manager_member_id = manager.id
on conflict (player_member_id) do update set
  base_price = excluded.base_price,
  final_bought_price = excluded.final_bought_price,
  status = excluded.status,
  buyer_team_id = excluded.buyer_team_id,
  resolved_at = excluded.resolved_at,
  note = excluded.note,
  updated_at = now();

-- Remove only old auction-sourced roster rows, then rebuild the finalized 45-player auction ownership.
delete from public.roster_entries where source = 'auction';

with final_auction(player_code, manager_code, final_price) as (
values
  ('UBSR-001', 'UBSR-024', 550), ('UBSR-040', 'UBSR-024', 580), ('UBSR-048', 'UBSR-024', 500), ('UBSR-049', 'UBSR-024', 125), ('UBSR-053', 'UBSR-024', 15),
  ('UBSR-005', 'UBSR-032', 375), ('UBSR-045', 'UBSR-032', 555), ('UBSR-041', 'UBSR-032', 575), ('UBSR-007', 'UBSR-032', 465), ('UBSR-035', 'UBSR-032', 30),
  ('UBSR-052', 'UBSR-006', 75), ('UBSR-050', 'UBSR-006', 705), ('UBSR-012', 'UBSR-006', 500), ('UBSR-004', 'UBSR-006', 255), ('UBSR-036', 'UBSR-006', 70),
  ('UBSR-030', 'UBSR-034', 400), ('UBSR-025', 'UBSR-034', 375), ('UBSR-044', 'UBSR-034', 720), ('UBSR-043', 'UBSR-034', 175), ('UBSR-013', 'UBSR-034', 15),
  ('UBSR-026', 'UBSR-028', 725), ('UBSR-046', 'UBSR-028', 125), ('UBSR-051', 'UBSR-028', 725), ('UBSR-016', 'UBSR-028', 150), ('UBSR-056', 'UBSR-028', 160),
  ('UBSR-017', 'UBSR-031', 175), ('UBSR-019', 'UBSR-031', 635), ('UBSR-033', 'UBSR-031', 960), ('UBSR-027', 'UBSR-031', 110), ('UBSR-037', 'UBSR-031', 15),
  ('UBSR-015', 'UBSR-029', 450), ('UBSR-008', 'UBSR-029', 350), ('UBSR-055', 'UBSR-029', 375), ('UBSR-054', 'UBSR-029', 570), ('UBSR-011', 'UBSR-029', 200),
  ('UBSR-021', 'UBSR-022', 625), ('UBSR-023', 'UBSR-022', 425), ('UBSR-020', 'UBSR-022', 695), ('UBSR-042', 'UBSR-022', 75), ('UBSR-003', 'UBSR-022', 50),
  ('UBSR-039', 'UBSR-047', 895), ('UBSR-038', 'UBSR-047', 625), ('UBSR-009', 'UBSR-047', 305), ('UBSR-002', 'UBSR-047', 20), ('UBSR-018', 'UBSR-047', 125)
)
insert into public.roster_entries(team_id, player_member_id, acquired_price, source)
select team.id, player.id, final_auction.final_price, 'auction'
from final_auction
join public.league_members player on player.member_code = final_auction.player_code
join public.league_members manager on manager.member_code = final_auction.manager_code
join public.teams team on team.manager_member_id = manager.id;

with balances(manager_code, balance) as (
values
  ('UBSR-024', 230), ('UBSR-032', 0), ('UBSR-006', 395), ('UBSR-034', 315), ('UBSR-028', 115),
  ('UBSR-031', 105), ('UBSR-029', 55), ('UBSR-022', 130), ('UBSR-047', 30)
)
update public.teams team
set opening_balance = 2000, current_balance = balances.balance, updated_at = now()
from balances
join public.league_members manager on manager.member_code = balances.manager_code
where team.manager_member_id = manager.id;

insert into public.league_activity(category, headline, detail)
select 'auction', 'Round 2 auction finalized', '45 players sold, 0 unsold, all 45 called. Total spent: 16,625 pts. The public auction log is finalized and immutable; the transfer market remains closed.'
where not exists (select 1 from public.league_activity where headline = 'Round 2 auction finalized');

commit;
