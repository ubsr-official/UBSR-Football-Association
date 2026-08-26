create extension if not exists pgcrypto;

create type public.league_role as enum ('manager', 'player');
create type public.auction_status as enum ('unassigned', 'auction_in_progress', 'sold', 'unsold', 'not_called');
create type public.fixture_window_status as enum ('draft', 'collecting_days', 'reviewing', 'published', 'cancelled');
create type public.fixture_proposal_status as enum ('proposed', 'accepted_by_home', 'accepted_by_away', 'ready_for_admin', 'published', 'rejected', 'withdrawn');
create type public.fixture_status as enum ('scheduled', 'completed', 'postponed', 'cancelled');
create type public.fixture_class as enum ('competitive', 'friendly');
create type public.trade_status as enum ('open', 'accepted', 'withdrawn', 'expired');
create type public.offer_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');
create type public.match_event_type as enum ('goal', 'yellow_card', 'red_card', 'player_of_the_match', 'committee_note');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.league_members (
  id uuid primary key default gen_random_uuid(),
  member_code text not null unique,
  full_name text not null,
  section text,
  league_role public.league_role not null,
  positions text,
  rating text,
  base_price integer not null check (base_price >= 0),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  account_status text not null default 'unlinked' check (account_status in ('unlinked', 'invited', 'active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  manager_member_id uuid not null unique references public.league_members(id) on delete restrict,
  name text not null unique,
  short_name text,
  logo_path text,
  accent_colour text,
  opening_balance integer not null default 2000 check (opening_balance >= 0),
  current_balance integer not null default 2000 check (current_balance >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_seats (
  seat text primary key check (seat in ('owner', 'arish')),
  display_name text not null,
  user_id uuid unique references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.market_settings (
  id smallint primary key default 1 check (id = 1),
  owner_enabled boolean not null default false,
  arish_enabled boolean not null default false,
  is_open boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.auction_records (
  id uuid primary key default gen_random_uuid(),
  player_member_id uuid not null unique references public.league_members(id) on delete restrict,
  base_price integer not null check (base_price >= 0),
  final_bought_price integer check (final_bought_price is null or final_bought_price >= 0),
  status public.auction_status not null default 'unassigned',
  buyer_team_id uuid references public.teams(id) on delete set null,
  note text,
  entered_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'sold') = (buyer_team_id is not null and final_bought_price is not null))
);

create table public.roster_entries (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_member_id uuid not null unique references public.league_members(id) on delete restrict,
  acquired_price integer not null check (acquired_price >= 0),
  source text not null check (source in ('auction', 'trade', 'admin_assignment')),
  acquired_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.manager_balance_adjustments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  amount integer not null check (amount <> 0),
  reason text not null check (char_length(reason) between 3 and 300),
  entered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.fixture_windows (
  id uuid primary key default gen_random_uuid(),
  home_team_id uuid not null references public.teams(id) on delete cascade,
  away_team_id uuid not null references public.teams(id) on delete cascade,
  start_day date not null,
  end_day date not null,
  status public.fixture_window_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  published_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (home_team_id <> away_team_id),
  check (end_day >= start_day)
);

create table public.manager_day_availability (
  id uuid primary key default gen_random_uuid(),
  fixture_window_id uuid not null references public.fixture_windows(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  available_day date not null,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (fixture_window_id, team_id, available_day)
);

create table public.fixture_proposals (
  id uuid primary key default gen_random_uuid(),
  fixture_window_id uuid not null references public.fixture_windows(id) on delete cascade,
  proposed_day date not null,
  home_accepted_at timestamptz,
  away_accepted_at timestamptz,
  status public.fixture_proposal_status not null default 'proposed',
  published_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fixture_window_id, proposed_day)
);

create table public.fixtures (
  id uuid primary key default gen_random_uuid(),
  fixture_window_id uuid unique references public.fixture_windows(id) on delete set null,
  proposal_id uuid unique references public.fixture_proposals(id) on delete set null,
  home_team_id uuid not null references public.teams(id) on delete restrict,
  away_team_id uuid not null references public.teams(id) on delete restrict,
  match_day date,
  competition_class public.fixture_class not null default 'competitive',
  status public.fixture_status not null default 'scheduled',
  home_score integer check (home_score is null or home_score >= 0),
  away_score integer check (away_score is null or away_score >= 0),
  player_of_match_member_id uuid references public.league_members(id) on delete set null,
  committee_note text,
  result_confirmed_by uuid references auth.users(id) on delete set null,
  result_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (home_team_id <> away_team_id),
  check ((status = 'completed') = (home_score is not null and away_score is not null))
);

create table public.match_events (
  id uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references public.fixtures(id) on delete cascade,
  event_type public.match_event_type not null,
  minute integer check (minute is null or minute between 0 and 150),
  player_member_id uuid references public.league_members(id) on delete set null,
  assist_member_id uuid references public.league_members(id) on delete set null,
  note text,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.public_trade_threads (
  id uuid primary key default gen_random_uuid(),
  player_member_id uuid not null references public.league_members(id) on delete restrict,
  seller_team_id uuid not null references public.teams(id) on delete restrict,
  base_price integer not null check (base_price >= 0),
  status public.trade_status not null default 'open',
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.public_trade_offers (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.public_trade_threads(id) on delete cascade,
  buyer_team_id uuid not null references public.teams(id) on delete restrict,
  bid_points integer not null check (bid_points >= 0),
  negotiation_note text,
  status public.offer_status not null default 'pending',
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.public_trade_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.public_trade_threads(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1200),
  created_at timestamptz not null default now()
);

create table public.private_team_messages (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1200),
  created_at timestamptz not null default now()
);

create table public.league_activity (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  headline text not null,
  detail text,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  detail text,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create index league_members_role_idx on public.league_members(league_role);
create index auction_status_idx on public.auction_records(status);
create index roster_team_idx on public.roster_entries(team_id);
create index fixture_window_teams_idx on public.fixture_windows(home_team_id, away_team_id);
create index availability_window_day_idx on public.manager_day_availability(fixture_window_id, available_day);
create index fixture_proposals_window_idx on public.fixture_proposals(fixture_window_id, proposed_day);
create index fixtures_match_day_idx on public.fixtures(match_day);
create index match_events_fixture_idx on public.match_events(fixture_id, created_at);
create index trade_threads_status_idx on public.public_trade_threads(status);
create index activity_created_idx on public.league_activity(created_at desc);
create index audit_entity_idx on public.audit_events(entity_type, entity_id, created_at desc);

insert into public.admin_seats(seat, display_name) values ('owner', 'League Owner'), ('arish', 'Arish') on conflict (seat) do nothing;
insert into public.market_settings(id, owner_enabled, arish_enabled, is_open) values (1, false, false, false) on conflict (id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles(id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), new.email)
  on conflict (id) do update set display_name = excluded.display_name, email = excluded.email, updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_league_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$ select exists(select 1 from public.admin_seats where user_id = auth.uid()) $$;

create or replace function public.current_member_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$ select id from public.league_members where auth_user_id = auth.uid() limit 1 $$;

create or replace function public.current_team_id()
returns uuid
language sql
stable
security definer set search_path = public
as $$ select id from public.teams where manager_member_id = public.current_member_id() limit 1 $$;

create or replace function public.can_view_league()
returns boolean
language sql
stable
security definer set search_path = public
as $$ select public.is_league_admin() or public.current_member_id() is not null $$;

create or replace function public.is_team_manager(target_team uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$ select public.is_league_admin() or target_team = public.current_team_id() $$;

create or replace function public.is_fixture_party(target_window uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$ select public.is_league_admin() or exists(select 1 from public.fixture_windows where id = target_window and public.current_team_id() in (home_team_id, away_team_id)) $$;

create or replace function public.recalculate_team_balance(target_team uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.teams set current_balance = opening_balance
    - coalesce((select sum(acquired_price) from public.roster_entries where team_id = target_team), 0)
    + coalesce((select sum(amount) from public.manager_balance_adjustments where team_id = target_team), 0),
    updated_at = now()
  where id = target_team;
end;
$$;

create or replace view public.live_standings with (security_invoker = true) as
with completed as (
  select * from public.fixtures
  where competition_class = 'competitive' and status = 'completed' and result_confirmed_at is not null
), rows as (
  select home_team_id as team_id, home_score as goals_for, away_score as goals_against,
    case when home_score > away_score then 1 else 0 end as wins,
    case when home_score = away_score then 1 else 0 end as draws,
    case when home_score < away_score then 1 else 0 end as losses,
    case when home_score > away_score then 3 when home_score = away_score then 1 else 0 end as points
  from completed
  union all
  select away_team_id, away_score, home_score,
    case when away_score > home_score then 1 else 0 end,
    case when away_score = home_score then 1 else 0 end,
    case when away_score < home_score then 1 else 0 end,
    case when away_score > home_score then 3 when away_score = home_score then 1 else 0 end
  from completed
)
select t.id as team_id, t.name as team_name, t.logo_path,
  count(rows.team_id)::integer as played,
  coalesce(sum(rows.wins), 0)::integer as wins,
  coalesce(sum(rows.draws), 0)::integer as draws,
  coalesce(sum(rows.losses), 0)::integer as losses,
  coalesce(sum(rows.goals_for), 0)::integer as goals_for,
  coalesce(sum(rows.goals_against), 0)::integer as goals_against,
  (coalesce(sum(rows.goals_for), 0) - coalesce(sum(rows.goals_against), 0))::integer as goal_difference,
  coalesce(sum(rows.points), 0)::integer as points
from public.teams t
left join rows on rows.team_id = t.id
where t.is_active = true
group by t.id, t.name, t.logo_path;

alter table public.profiles enable row level security;
alter table public.league_members enable row level security;
alter table public.teams enable row level security;
alter table public.admin_seats enable row level security;
alter table public.market_settings enable row level security;
alter table public.auction_records enable row level security;
alter table public.roster_entries enable row level security;
alter table public.manager_balance_adjustments enable row level security;
alter table public.fixture_windows enable row level security;
alter table public.manager_day_availability enable row level security;
alter table public.fixture_proposals enable row level security;
alter table public.fixtures enable row level security;
alter table public.match_events enable row level security;
alter table public.public_trade_threads enable row level security;
alter table public.public_trade_offers enable row level security;
alter table public.public_trade_messages enable row level security;
alter table public.private_team_messages enable row level security;
alter table public.league_activity enable row level security;
alter table public.audit_events enable row level security;

create policy "profile owner or admin read" on public.profiles for select using (id = auth.uid() or public.is_league_admin());
create policy "profile owner update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "league members read" on public.league_members for select using (public.can_view_league());
create policy "league members admin update" on public.league_members for update using (public.is_league_admin()) with check (public.is_league_admin());
create policy "teams read" on public.teams for select using (public.can_view_league());
create policy "teams manager or admin update" on public.teams for update using (public.is_team_manager(id)) with check (public.is_team_manager(id));
create policy "admin seats read" on public.admin_seats for select using (public.is_league_admin());
create policy "admin seats owner managed" on public.admin_seats for update using (exists(select 1 from public.admin_seats where seat = 'owner' and user_id = auth.uid())) with check (exists(select 1 from public.admin_seats where seat = 'owner' and user_id = auth.uid()));
create policy "market read" on public.market_settings for select using (public.can_view_league());
create policy "market admin update" on public.market_settings for update using (public.is_league_admin()) with check (public.is_league_admin());
create policy "auction read" on public.auction_records for select using (public.can_view_league());
create policy "auction admin manage" on public.auction_records for all using (public.is_league_admin()) with check (public.is_league_admin());
create policy "rosters read" on public.roster_entries for select using (public.can_view_league());
create policy "rosters admin manage" on public.roster_entries for all using (public.is_league_admin()) with check (public.is_league_admin());
create policy "balance ledger admin read" on public.manager_balance_adjustments for select using (public.is_league_admin());
create policy "balance ledger admin manage" on public.manager_balance_adjustments for all using (public.is_league_admin()) with check (public.is_league_admin());
create policy "fixture windows relevant teams read" on public.fixture_windows for select using (public.is_fixture_party(id));
create policy "fixture windows admin manage" on public.fixture_windows for all using (public.is_league_admin()) with check (public.is_league_admin());
create policy "availability relevant teams read" on public.manager_day_availability for select using (public.is_fixture_party(fixture_window_id));
create policy "availability team manager insert" on public.manager_day_availability for insert with check (public.is_fixture_party(fixture_window_id) and public.is_team_manager(team_id) and submitted_by = auth.uid());
create policy "availability team manager delete" on public.manager_day_availability for delete using (public.is_team_manager(team_id));
create policy "proposals relevant teams read" on public.fixture_proposals for select using (public.is_fixture_party(fixture_window_id));
create policy "proposals admin manage" on public.fixture_proposals for all using (public.is_league_admin()) with check (public.is_league_admin());
create policy "fixtures read" on public.fixtures for select using (public.can_view_league());
create policy "fixtures admin manage" on public.fixtures for all using (public.is_league_admin()) with check (public.is_league_admin());
create policy "match events read" on public.match_events for select using (public.can_view_league());
create policy "match events admin manage" on public.match_events for all using (public.is_league_admin()) with check (public.is_league_admin());
create policy "trade threads read" on public.public_trade_threads for select using (public.can_view_league());
create policy "trade threads manager insert" on public.public_trade_threads for insert with check (public.is_team_manager(seller_team_id));
create policy "trade threads seller or admin update" on public.public_trade_threads for update using (public.is_team_manager(seller_team_id)) with check (public.is_team_manager(seller_team_id));
create policy "trade offers read" on public.public_trade_offers for select using (public.can_view_league());
create policy "trade offers manager insert" on public.public_trade_offers for insert with check (public.is_team_manager(buyer_team_id));
create policy "trade messages read" on public.public_trade_messages for select using (public.can_view_league());
create policy "trade messages member insert" on public.public_trade_messages for insert with check (author_id = auth.uid() and public.can_view_league());
create policy "private team messages team only read" on public.private_team_messages for select using (public.is_team_manager(team_id));
create policy "private team messages team only insert" on public.private_team_messages for insert with check (public.is_team_manager(team_id) and author_id = auth.uid());
create policy "activity read" on public.league_activity for select using (public.can_view_league());
create policy "activity admin manage" on public.league_activity for all using (public.is_league_admin()) with check (public.is_league_admin());
create policy "audit admin read" on public.audit_events for select using (public.is_league_admin());
create policy "audit admin insert" on public.audit_events for insert with check (public.is_league_admin());

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('team-logos', 'team-logos', false, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "team managers upload logos" on storage.objects for insert to authenticated
with check (bucket_id = 'team-logos' and (public.is_league_admin() or name like public.current_team_id()::text || '/%'));
create policy "team managers update logos" on storage.objects for update to authenticated
using (bucket_id = 'team-logos' and (public.is_league_admin() or name like public.current_team_id()::text || '/%'));
create policy "league members read logos" on storage.objects for select to authenticated
using (bucket_id = 'team-logos' and public.can_view_league());
create policy "team managers delete logos" on storage.objects for delete to authenticated
using (bucket_id = 'team-logos' and (public.is_league_admin() or name like public.current_team_id()::text || '/%'));

grant select on public.live_standings to authenticated;
