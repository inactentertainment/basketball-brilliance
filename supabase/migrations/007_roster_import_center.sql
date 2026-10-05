-- Build 1 roster import center: secure bulk player import with duplicate protection.
create or replace function public.import_team_players(p_team_id uuid, p_players jsonb)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  item jsonb; uid uuid := auth.uid(); first_name text; last_name text; jersey text; pos text; grd text; ht text;
  gname text; gemail text; gphone text; new_player_id uuid; imported_count integer := 0; skipped_count integer := 0;
  result_ids jsonb := '[]'::jsonb;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if not public.is_team_coach(p_team_id,uid) then raise exception 'Coach access required'; end if;
  if jsonb_typeof(p_players) <> 'array' then raise exception 'Players must be an array'; end if;
  for item in select value from jsonb_array_elements(p_players) loop
    first_name := nullif(trim(coalesce(item->>'first_name','')),''); last_name := nullif(trim(coalesce(item->>'last_name','')),'');
    jersey := nullif(trim(coalesce(item->>'jersey_number','')),''); pos := nullif(trim(coalesce(item->>'position','')),'');
    grd := nullif(trim(coalesce(item->>'grade','')),''); ht := nullif(trim(coalesce(item->>'height_text','')),'');
    gname := nullif(trim(coalesce(item->>'guardian_name','')),''); gemail := nullif(trim(coalesce(item->>'guardian_email','')),'');
    gphone := nullif(trim(coalesce(item->>'guardian_phone','')),'');
    if first_name is null then skipped_count := skipped_count + 1; continue; end if;
    if exists(select 1 from public.team_players tp join public.players p on p.id=tp.player_id
      where tp.team_id=p_team_id and tp.status='active' and lower(trim(p.first_name))=lower(first_name)
      and lower(trim(coalesce(p.last_name,'')))=lower(coalesce(last_name,'')) and coalesce(trim(p.jersey_number),'')=coalesce(jersey,''))
    then skipped_count := skipped_count + 1; continue; end if;
    insert into public.players(first_name,last_name,jersey_number,position,grade,height_text,guardian_name,guardian_email,guardian_phone,created_by)
    values(first_name,last_name,jersey,pos,grd,ht,gname,gemail,gphone,uid) returning id into new_player_id;
    insert into public.team_players(team_id,player_id,status) values(p_team_id,new_player_id,'active');
    imported_count := imported_count + 1; result_ids := result_ids || jsonb_build_array(new_player_id);
  end loop;
  return jsonb_build_object('imported',imported_count,'skipped',skipped_count,'player_ids',result_ids);
end; $$;
revoke execute on function public.import_team_players(uuid,jsonb) from public, anon;
grant execute on function public.import_team_players(uuid,jsonb) to authenticated;
