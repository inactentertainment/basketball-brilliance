create or replace function public.create_team_player(
  p_team_id uuid,
  p_first_name text,
  p_last_name text default null,
  p_jersey_number text default null,
  p_position text default null,
  p_grade text default null,
  p_height_text text default null,
  p_guardian_name text default null,
  p_guardian_email text default null,
  p_guardian_phone text default null
)
returns public.players
language plpgsql
security definer
set search_path=public
as $$
declare p public.players%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.is_team_coach(p_team_id,auth.uid()) then raise exception 'Coach access required'; end if;

  insert into public.players(
    first_name,last_name,jersey_number,position,grade,height_text,
    guardian_name,guardian_email,guardian_phone,created_by
  )
  values(
    trim(p_first_name),nullif(trim(coalesce(p_last_name,'')),''),
    nullif(trim(coalesce(p_jersey_number,'')),''),
    nullif(trim(coalesce(p_position,'')),''),
    nullif(trim(coalesce(p_grade,'')),''),
    nullif(trim(coalesce(p_height_text,'')),''),
    nullif(trim(coalesce(p_guardian_name,'')),''),
    nullif(trim(coalesce(p_guardian_email,'')),''),
    nullif(trim(coalesce(p_guardian_phone,'')),''),
    auth.uid()
  )
  returning * into p;

  insert into public.team_players(team_id,player_id,status)
  values(p_team_id,p.id,'active');

  return p;
end;
$$;

revoke execute on function public.create_team_player(uuid,text,text,text,text,text,text,text,text,text) from public,anon;
grant execute on function public.create_team_player(uuid,text,text,text,text,text,text,text,text,text) to authenticated;
