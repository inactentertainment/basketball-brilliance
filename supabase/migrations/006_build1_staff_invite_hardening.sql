-- Final Build 1 hardening: one coach membership per team/user and role alignment on invite acceptance.

create unique index if not exists uq_team_coach_membership
  on public.team_memberships(team_id,user_id)
  where role='coach';

create or replace function public.accept_team_invite(p_code text)
returns jsonb
language plpgsql security definer set search_path=public
as $$
declare inv public.team_invites%rowtype;
begin
  select * into inv
  from public.team_invites
  where invite_code=upper(trim(p_code))
    and status='pending'
    and expires_at>now()
  for update;

  if not found then raise exception 'Invite is invalid or expired'; end if;
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  if inv.role='coach' then
    insert into public.team_memberships(team_id,user_id,role,player_id,status,staff_title)
    values(inv.team_id,auth.uid(),'coach',null,'active',coalesce(inv.staff_title,'Assistant Coach'))
    on conflict do nothing;
    update public.profiles set primary_role='coach' where id=auth.uid();
  else
    insert into public.team_memberships(team_id,user_id,role,player_id,status,staff_title)
    values(inv.team_id,auth.uid(),inv.role,inv.player_id,'active',null)
    on conflict do nothing;

    if inv.role='player' and inv.player_id is not null then
      update public.players set owner_user_id=coalesce(owner_user_id,auth.uid()) where id=inv.player_id;
      update public.profiles set primary_role='player' where id=auth.uid();
    elsif inv.role='parent' and inv.player_id is not null then
      insert into public.player_guardians(player_id,guardian_user_id,is_primary)
      values(inv.player_id,auth.uid(),true) on conflict do nothing;
      update public.profiles set primary_role='parent' where id=auth.uid();
    end if;
  end if;

  update public.team_invites
     set status='accepted',accepted_by=auth.uid(),accepted_at=now()
   where id=inv.id;

  return jsonb_build_object(
    'team_id',inv.team_id,
    'player_id',inv.player_id,
    'role',inv.role,
    'staff_title',inv.staff_title
  );
end; $$;

grant execute on function public.accept_team_invite(text) to authenticated;
