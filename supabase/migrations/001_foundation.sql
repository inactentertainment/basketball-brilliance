-- Basketball Brilliance foundation schema
-- Build 1: accounts, roles, organizations, teams, player relationships, invites, memberships.
-- Apply to the dedicated Basketball Brilliance Supabase project.

create extension if not exists pgcrypto;

do $$ begin
  create type public.bb_role as enum ('coach','player','parent','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.bb_membership_status as enum ('preview','active','past_due','canceled','expired');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  primary_role public.bb_role not null default 'player',
  avatar_url text,
  phone text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  name text not null,
  season text,
  level text,
  home_gym text,
  head_coach_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles(id) on delete set null,
  first_name text not null,
  last_name text,
  jersey_number text,
  position text,
  grade text,
  height_text text,
  graduation_year integer,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null default 'active' check (status in ('active','inactive','alumni')),
  created_at timestamptz not null default now(),
  unique(team_id,player_id)
);

create table if not exists public.player_guardians (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  guardian_user_id uuid not null references public.profiles(id) on delete cascade,
  relationship text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique(player_id,guardian_user_id)
);

create table if not exists public.team_memberships (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.bb_role not null,
  player_id uuid references public.players(id) on delete cascade,
  status text not null default 'active' check (status in ('active','invited','inactive')),
  created_at timestamptz not null default now(),
  unique(team_id,user_id,role,player_id)
);

create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  email text not null,
  role public.bb_role not null check (role in ('player','parent')),
  invite_code text not null unique default upper(substr(encode(gen_random_bytes(8),'hex'),1,10)),
  status text not null default 'pending' check (status in ('pending','accepted','expired','revoked')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.bb_role not null,
  plan_code text not null,
  status public.bb_membership_status not null default 'preview',
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,role)
);

create table if not exists public.practices (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  practice_date date,
  objectives text,
  plan jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  game_date date,
  opponent text,
  location text,
  team_score integer,
  opponent_score integer,
  result text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.player_game_stats (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  points integer not null default 0,
  rebounds integer not null default 0,
  assists integer not null default 0,
  steals integer not null default 0,
  blocks integer not null default 0,
  turnovers integer not null default 0,
  minutes numeric,
  extras jsonb not null default '{}'::jsonb,
  unique(game_id,player_id)
);

create table if not exists public.scouting_reports (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  opponent text not null,
  report jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.season_notes (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  note_date date not null default current_date,
  category text,
  body text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists set_teams_updated_at on public.teams;
create trigger set_teams_updated_at before update on public.teams for each row execute function public.set_updated_at();
drop trigger if exists set_players_updated_at on public.players;
create trigger set_players_updated_at before update on public.players for each row execute function public.set_updated_at();
drop trigger if exists set_memberships_updated_at on public.memberships;
create trigger set_memberships_updated_at before update on public.memberships for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare requested_role public.bb_role;
begin
  requested_role := case lower(coalesce(new.raw_user_meta_data->>'role','player'))
    when 'coach' then 'coach'::public.bb_role
    when 'parent' then 'parent'::public.bb_role
    when 'admin' then 'admin'::public.bb_role
    else 'player'::public.bb_role
  end;
  insert into public.profiles(id,email,full_name,primary_role)
  values(new.id,new.email,new.raw_user_meta_data->>'full_name',requested_role)
  on conflict(id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_team_coach(p_team uuid, p_user uuid default auth.uid())
returns boolean
language sql stable security definer set search_path=public
as $$
  select exists(
    select 1 from public.teams t
    where t.id=p_team and (t.head_coach_id=p_user or t.created_by=p_user)
  ) or exists(
    select 1 from public.team_memberships tm
    where tm.team_id=p_team and tm.user_id=p_user and tm.role='coach' and tm.status='active'
  );
$$;

create or replace function public.can_access_player(p_player uuid, p_user uuid default auth.uid())
returns boolean
language sql stable security definer set search_path=public
as $$
  select exists(select 1 from public.players p where p.id=p_player and (p.owner_user_id=p_user or p.created_by=p_user))
  or exists(select 1 from public.player_guardians pg where pg.player_id=p_player and pg.guardian_user_id=p_user)
  or exists(
    select 1 from public.team_players tp
    where tp.player_id=p_player and public.is_team_coach(tp.team_id,p_user)
  );
$$;

create or replace function public.accept_team_invite(p_code text)
returns jsonb
language plpgsql security definer set search_path=public
as $$
declare inv public.team_invites%rowtype;
begin
  select * into inv from public.team_invites
  where invite_code=upper(trim(p_code)) and status='pending' and expires_at>now()
  for update;
  if not found then raise exception 'Invite is invalid or expired'; end if;
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  insert into public.team_memberships(team_id,user_id,role,player_id,status)
  values(inv.team_id,auth.uid(),inv.role,inv.player_id,'active')
  on conflict do nothing;

  if inv.role='player' and inv.player_id is not null then
    update public.players set owner_user_id=coalesce(owner_user_id,auth.uid()) where id=inv.player_id;
  elsif inv.role='parent' and inv.player_id is not null then
    insert into public.player_guardians(player_id,guardian_user_id,is_primary)
    values(inv.player_id,auth.uid(),true) on conflict do nothing;
  end if;

  update public.team_invites set status='accepted',accepted_by=auth.uid(),accepted_at=now() where id=inv.id;
  return jsonb_build_object('team_id',inv.team_id,'player_id',inv.player_id,'role',inv.role);
end; $$;

grant usage on schema public to authenticated;
grant select,insert,update,delete on all tables in schema public to authenticated;
grant execute on function public.accept_team_invite(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.team_players enable row level security;
alter table public.player_guardians enable row level security;
alter table public.team_memberships enable row level security;
alter table public.team_invites enable row level security;
alter table public.memberships enable row level security;
alter table public.practices enable row level security;
alter table public.games enable row level security;
alter table public.player_game_stats enable row level security;
alter table public.scouting_reports enable row level security;
alter table public.season_notes enable row level security;

drop policy if exists "profiles self select" on public.profiles;
create policy "profiles self select" on public.profiles for select to authenticated using (id=auth.uid());
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

drop policy if exists "organizations member select" on public.organizations;
create policy "organizations member select" on public.organizations for select to authenticated using (
  created_by=auth.uid() or exists(select 1 from public.teams t join public.team_memberships tm on tm.team_id=t.id where t.organization_id=organizations.id and tm.user_id=auth.uid() and tm.status='active')
);
drop policy if exists "organizations creator insert" on public.organizations;
create policy "organizations creator insert" on public.organizations for insert to authenticated with check (created_by=auth.uid());
drop policy if exists "organizations creator update" on public.organizations;
create policy "organizations creator update" on public.organizations for update to authenticated using (created_by=auth.uid());

drop policy if exists "teams member select" on public.teams;
create policy "teams member select" on public.teams for select to authenticated using (
  created_by=auth.uid() or head_coach_id=auth.uid() or exists(select 1 from public.team_memberships tm where tm.team_id=teams.id and tm.user_id=auth.uid() and tm.status='active')
);
drop policy if exists "teams coach insert" on public.teams;
create policy "teams coach insert" on public.teams for insert to authenticated with check (created_by=auth.uid());
drop policy if exists "teams coach update" on public.teams;
create policy "teams coach update" on public.teams for update to authenticated using (public.is_team_coach(id));
drop policy if exists "teams coach delete" on public.teams;
create policy "teams coach delete" on public.teams for delete to authenticated using (public.is_team_coach(id));

drop policy if exists "players linked select" on public.players;
create policy "players linked select" on public.players for select to authenticated using (public.can_access_player(id));
drop policy if exists "players coach insert" on public.players;
create policy "players coach insert" on public.players for insert to authenticated with check (created_by=auth.uid());
drop policy if exists "players linked update" on public.players;
create policy "players linked update" on public.players for update to authenticated using (public.can_access_player(id));

drop policy if exists "team players member select" on public.team_players;
create policy "team players member select" on public.team_players for select to authenticated using (
  public.is_team_coach(team_id) or public.can_access_player(player_id)
);
drop policy if exists "team players coach write" on public.team_players;
create policy "team players coach write" on public.team_players for all to authenticated using (public.is_team_coach(team_id)) with check (public.is_team_coach(team_id));

drop policy if exists "guardians linked select" on public.player_guardians;
create policy "guardians linked select" on public.player_guardians for select to authenticated using (
  guardian_user_id=auth.uid() or public.can_access_player(player_id)
);
drop policy if exists "guardians self or coach write" on public.player_guardians;
create policy "guardians self or coach write" on public.player_guardians for all to authenticated using (
  guardian_user_id=auth.uid() or public.can_access_player(player_id)
) with check (guardian_user_id=auth.uid() or public.can_access_player(player_id));

drop policy if exists "team memberships visible" on public.team_memberships;
create policy "team memberships visible" on public.team_memberships for select to authenticated using (
  user_id=auth.uid() or public.is_team_coach(team_id)
);
drop policy if exists "team memberships coach write" on public.team_memberships;
create policy "team memberships coach write" on public.team_memberships for all to authenticated using (public.is_team_coach(team_id)) with check (public.is_team_coach(team_id));

drop policy if exists "invites coach select" on public.team_invites;
create policy "invites coach select" on public.team_invites for select to authenticated using (public.is_team_coach(team_id));
drop policy if exists "invites coach write" on public.team_invites;
create policy "invites coach write" on public.team_invites for all to authenticated using (public.is_team_coach(team_id)) with check (public.is_team_coach(team_id) and created_by=auth.uid());

drop policy if exists "memberships self select" on public.memberships;
create policy "memberships self select" on public.memberships for select to authenticated using (user_id=auth.uid());

drop policy if exists "practices team select" on public.practices;
create policy "practices team select" on public.practices for select to authenticated using (
  public.is_team_coach(team_id) or exists(select 1 from public.team_memberships tm where tm.team_id=practices.team_id and tm.user_id=auth.uid() and tm.status='active')
);
drop policy if exists "practices coach write" on public.practices;
create policy "practices coach write" on public.practices for all to authenticated using (public.is_team_coach(team_id)) with check (public.is_team_coach(team_id) and created_by=auth.uid());

drop policy if exists "games team select" on public.games;
create policy "games team select" on public.games for select to authenticated using (
  public.is_team_coach(team_id) or exists(select 1 from public.team_memberships tm where tm.team_id=games.team_id and tm.user_id=auth.uid() and tm.status='active')
);
drop policy if exists "games coach write" on public.games;
create policy "games coach write" on public.games for all to authenticated using (public.is_team_coach(team_id)) with check (public.is_team_coach(team_id) and created_by=auth.uid());

drop policy if exists "stats linked select" on public.player_game_stats;
create policy "stats linked select" on public.player_game_stats for select to authenticated using (public.can_access_player(player_id));
drop policy if exists "stats coach write" on public.player_game_stats;
create policy "stats coach write" on public.player_game_stats for all to authenticated using (
  exists(select 1 from public.games g where g.id=game_id and public.is_team_coach(g.team_id))
) with check (
  exists(select 1 from public.games g where g.id=game_id and public.is_team_coach(g.team_id))
);

drop policy if exists "scouting team select" on public.scouting_reports;
create policy "scouting team select" on public.scouting_reports for select to authenticated using (public.is_team_coach(team_id));
drop policy if exists "scouting coach write" on public.scouting_reports;
create policy "scouting coach write" on public.scouting_reports for all to authenticated using (public.is_team_coach(team_id)) with check (public.is_team_coach(team_id) and created_by=auth.uid());

drop policy if exists "notes team select" on public.season_notes;
create policy "notes team select" on public.season_notes for select to authenticated using (public.is_team_coach(team_id));
drop policy if exists "notes coach write" on public.season_notes;
create policy "notes coach write" on public.season_notes for all to authenticated using (public.is_team_coach(team_id)) with check (public.is_team_coach(team_id) and created_by=auth.uid());
