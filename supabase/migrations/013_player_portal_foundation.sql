create table if not exists public.player_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_date date,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.player_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null default current_date,
  focus text not null,
  minutes integer not null default 0,
  notes text,
  created_at timestamptz not null default now()
);
create table if not exists public.player_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  url text,
  game_date date,
  notes text,
  created_at timestamptz not null default now()
);
create table if not exists public.player_passport_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  season text,
  team text not null,
  coach text,
  position text,
  level text,
  achievements text,
  created_at timestamptz not null default now()
);
create table if not exists public.player_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  opportunity_type text,
  event_date date,
  url text,
  status text not null default 'interested',
  notes text,
  created_at timestamptz not null default now()
);
alter table public.player_goals enable row level security;
alter table public.player_workouts enable row level security;
alter table public.player_highlights enable row level security;
alter table public.player_passport_entries enable row level security;
alter table public.player_opportunities enable row level security;
drop policy if exists player_goals_self on public.player_goals;
create policy player_goals_self on public.player_goals for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists player_workouts_self on public.player_workouts;
create policy player_workouts_self on public.player_workouts for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists player_highlights_self on public.player_highlights;
create policy player_highlights_self on public.player_highlights for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists player_passport_self on public.player_passport_entries;
create policy player_passport_self on public.player_passport_entries for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists player_opportunities_self on public.player_opportunities;
create policy player_opportunities_self on public.player_opportunities for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create index if not exists idx_player_goals_user on public.player_goals(user_id,created_at desc);
create index if not exists idx_player_workouts_user on public.player_workouts(user_id,workout_date desc);
create index if not exists idx_player_highlights_user on public.player_highlights(user_id,created_at desc);
create index if not exists idx_player_passport_user on public.player_passport_entries(user_id,created_at desc);
create index if not exists idx_player_opportunities_user on public.player_opportunities(user_id,event_date);