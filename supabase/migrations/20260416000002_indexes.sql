-- ============================================================
-- Migration: Indexes
-- ============================================================

-- leagues
create index idx_leagues_commissioner_id  on public.leagues (commissioner_id);

-- teams
create index idx_teams_league_id          on public.teams (league_id);
create index idx_teams_user_id            on public.teams (user_id);

-- rosters
create index idx_rosters_team_id          on public.rosters (team_id);
create index idx_rosters_player_id        on public.rosters (player_id);

-- drafts
create index idx_drafts_league_id         on public.drafts (league_id);

-- draft_picks
create index idx_draft_picks_draft_id     on public.draft_picks (draft_id);
create index idx_draft_picks_team_id      on public.draft_picks (team_id);
create index idx_draft_picks_player_id    on public.draft_picks (player_id);

-- trades
create index idx_trades_league_id         on public.trades (league_id);
create index idx_trades_proposing_team_id on public.trades (proposing_team_id);
create index idx_trades_receiving_team_id on public.trades (receiving_team_id);

-- trade_assets
create index idx_trade_assets_trade_id    on public.trade_assets (trade_id);
create index idx_trade_assets_player_id   on public.trade_assets (player_id);
create index idx_trade_assets_from_team   on public.trade_assets (from_team_id);
create index idx_trade_assets_to_team     on public.trade_assets (to_team_id);

-- matchups
create index idx_matchups_league_id       on public.matchups (league_id);
create index idx_matchups_home_team_id    on public.matchups (home_team_id);
create index idx_matchups_away_team_id    on public.matchups (away_team_id);
create index idx_matchups_week            on public.matchups (league_id, week);

-- transactions
create index idx_transactions_league_id   on public.transactions (league_id);
create index idx_transactions_team_id     on public.transactions (team_id);
create index idx_transactions_player_id   on public.transactions (player_id);
create index idx_transactions_created_at  on public.transactions (created_at desc);

-- scoring_settings
create index idx_scoring_settings_league  on public.scoring_settings (league_id);

-- waivers
create index idx_waivers_league_id        on public.waivers (league_id);
create index idx_waivers_team_id          on public.waivers (team_id);
create index idx_waivers_player_id        on public.waivers (player_id);
create index idx_waivers_priority         on public.waivers (league_id, priority);

-- players — sport + position are the most common filter axes
create index idx_players_sport            on public.players (sport);
create index idx_players_position         on public.players (sport, position);
create index idx_players_msf_id           on public.players (msf_player_id);
