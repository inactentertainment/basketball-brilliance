create table if not exists public.player_college_pathway (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school text not null,
  level text,
  status text not null default 'researching',
  contact_name text,
  contact_email text,
  next_step text,
  next_step_date date,
  notes text,
  created_at timestamptz not null default now()
);
create table if not exists public.player_bounce_back (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_date date not null default current_date,
  setback text not null,
  controllables text,
  lesson text,
  next_action text,
  confidence integer check (confidence between 1 and 5),
  created_at timestamptz not null default now()
);
alter table public.player_college_pathway enable row level security;
alter table public.player_bounce_back enable row level security;
drop policy if exists player_college_pathway_self on public.player_college_pathway;
create policy player_college_pathway_self on public.player_college_pathway for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists player_bounce_back_self on public.player_bounce_back;
create policy player_bounce_back_self on public.player_bounce_back for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create index if not exists idx_player_college_pathway_user on public.player_college_pathway(user_id,next_step_date);
create index if not exists idx_player_bounce_back_user on public.player_bounce_back(user_id,event_date desc);