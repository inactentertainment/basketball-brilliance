create schema if not exists private;

alter function public.set_updated_at() set search_path = public;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.accept_team_invite(text) from public, anon;
grant execute on function public.accept_team_invite(text) to authenticated;

revoke execute on function public.is_team_coach(uuid,uuid) from public, anon;
revoke execute on function public.can_access_player(uuid,uuid) from public, anon;
grant execute on function public.is_team_coach(uuid,uuid) to authenticated;
grant execute on function public.can_access_player(uuid,uuid) to authenticated;

create index if not exists idx_teams_org on public.teams(organization_id);
create index if not exists idx_teams_head_coach on public.teams(head_coach_id);
create index if not exists idx_teams_created_by on public.teams(created_by);
create index if not exists idx_players_owner on public.players(owner_user_id);
create index if not exists idx_players_created_by on public.players(created_by);
create index if not exists idx_team_players_player on public.team_players(player_id);
create index if not exists idx_player_guardians_guardian on public.player_guardians(guardian_user_id);
create index if not exists idx_team_memberships_user on public.team_memberships(user_id);
create index if not exists idx_team_memberships_player on public.team_memberships(player_id);
create index if not exists idx_team_invites_team on public.team_invites(team_id);
create index if not exists idx_team_invites_player on public.team_invites(player_id);
create index if not exists idx_team_invites_created_by on public.team_invites(created_by);
create index if not exists idx_team_invites_accepted_by on public.team_invites(accepted_by);
create index if not exists idx_practices_team on public.practices(team_id);
create index if not exists idx_practices_created_by on public.practices(created_by);
create index if not exists idx_games_team on public.games(team_id);
create index if not exists idx_games_created_by on public.games(created_by);
create index if not exists idx_player_game_stats_player on public.player_game_stats(player_id);
create index if not exists idx_scouting_team on public.scouting_reports(team_id);
create index if not exists idx_scouting_created_by on public.scouting_reports(created_by);
create index if not exists idx_notes_team on public.season_notes(team_id);
create index if not exists idx_notes_created_by on public.season_notes(created_by);
create index if not exists idx_org_created_by on public.organizations(created_by);
