alter table public.players
  add column if not exists guardian_name text,
  add column if not exists guardian_email text,
  add column if not exists guardian_phone text;

alter table public.team_memberships
  add column if not exists staff_title text,
  add column if not exists permissions jsonb not null default '{}'::jsonb;

alter table public.team_invites
  drop constraint if exists team_invites_role_check;

alter table public.team_invites
  add constraint team_invites_role_check check (role in ('coach','player','parent'));

alter table public.team_invites
  add column if not exists invitee_name text,
  add column if not exists staff_title text;

create index if not exists idx_team_memberships_team_role on public.team_memberships(team_id,role,status);
create index if not exists idx_team_invites_email on public.team_invites(lower(email));

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

  insert into public.team_memberships(team_id,user_id,role,player_id,status,staff_title)
  values(inv.team_id,auth.uid(),inv.role,inv.player_id,'active',case when inv.role='coach' then coalesce(inv.staff_title,'Assistant Coach') else null end)
  on conflict do nothing;

  if inv.role='player' and inv.player_id is not null then
    update public.players set owner_user_id=coalesce(owner_user_id,auth.uid()) where id=inv.player_id;
  elsif inv.role='parent' and inv.player_id is not null then
    insert into public.player_guardians(player_id,guardian_user_id,is_primary)
    values(inv.player_id,auth.uid(),true) on conflict do nothing;
  end if;

  update public.team_invites set status='accepted',accepted_by=auth.uid(),accepted_at=now() where id=inv.id;

  return jsonb_build_object('team_id',inv.team_id,'player_id',inv.player_id,'role',inv.role,'staff_title',inv.staff_title);
end; $$;

grant execute on function public.accept_team_invite(text) to authenticated;
