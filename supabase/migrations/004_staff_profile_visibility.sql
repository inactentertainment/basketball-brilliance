drop policy if exists "profiles staff team select" on public.profiles;
create policy "profiles staff team select"
on public.profiles for select to authenticated
using (
  id=auth.uid()
  or exists(
    select 1
    from public.team_memberships target
    where target.user_id=profiles.id
      and target.role='coach'
      and target.status='active'
      and public.is_team_coach(target.team_id)
  )
);
