alter table public.season_notes add column if not exists title text;

create index if not exists idx_stats_game on public.player_game_stats(game_id);
create index if not exists idx_stats_player on public.player_game_stats(player_id);
create index if not exists idx_practices_date on public.practices(team_id,practice_date desc);
create index if not exists idx_games_date on public.games(team_id,game_date desc);
create index if not exists idx_scouting_created on public.scouting_reports(team_id,created_at desc);
create index if not exists idx_notes_date on public.season_notes(team_id,note_date desc);
