create table if not exists public.coach_iq_history (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  scenario_key text,
  selected_solution text,
  created_at timestamptz not null default now()
);

alter table public.coach_iq_history enable row level security;

drop policy if exists coach_iq_history_select on public.coach_iq_history;
create policy coach_iq_history_select on public.coach_iq_history
for select to authenticated
using (public.is_team_coach(team_id,auth.uid()));

drop policy if exists coach_iq_history_insert on public.coach_iq_history;
create policy coach_iq_history_insert on public.coach_iq_history
for insert to authenticated
with check (public.is_team_coach(team_id,auth.uid()) and user_id=auth.uid());

drop policy if exists coach_iq_history_delete on public.coach_iq_history;
create policy coach_iq_history_delete on public.coach_iq_history
for delete to authenticated
using (user_id=auth.uid());

create index if not exists idx_coach_iq_history_team_created
on public.coach_iq_history(team_id,created_at desc);
