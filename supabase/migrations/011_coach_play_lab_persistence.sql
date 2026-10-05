create table if not exists public.coach_plays (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  markers jsonb not null default '[]'::jsonb,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.coach_plays enable row level security;
drop policy if exists coach_plays_select on public.coach_plays;
create policy coach_plays_select on public.coach_plays for select to authenticated using (public.is_team_coach(team_id,auth.uid()));
drop policy if exists coach_plays_insert on public.coach_plays;
create policy coach_plays_insert on public.coach_plays for insert to authenticated with check (public.is_team_coach(team_id,auth.uid()) and created_by=auth.uid());
drop policy if exists coach_plays_update on public.coach_plays;
create policy coach_plays_update on public.coach_plays for update to authenticated using (public.is_team_coach(team_id,auth.uid())) with check (public.is_team_coach(team_id,auth.uid()));
drop policy if exists coach_plays_delete on public.coach_plays;
create policy coach_plays_delete on public.coach_plays for delete to authenticated using (public.is_team_coach(team_id,auth.uid()));
create index if not exists idx_coach_plays_team_created on public.coach_plays(team_id,created_at desc);