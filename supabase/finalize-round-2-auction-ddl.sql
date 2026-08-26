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
drop policy if exists auction_log_admin_insert on public.auction_log_entries;
create policy auction_log_admin_insert on public.auction_log_entries for insert with check (public.is_league_admin());
drop policy if exists auction_log_no_update on public.auction_log_entries;
create policy auction_log_no_update on public.auction_log_entries for update using (false);
drop policy if exists auction_log_no_delete on public.auction_log_entries;
create policy auction_log_no_delete on public.auction_log_entries for delete using (false);
