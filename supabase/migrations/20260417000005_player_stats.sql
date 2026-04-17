-- Add draft_order to drafts table
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS draft_order jsonb DEFAULT '[]'::jsonb;
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS current_pick integer DEFAULT 1;
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS timer_seconds integer DEFAULT 90;

-- Player stats table
CREATE TABLE IF NOT EXISTS player_stats (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season      integer NOT NULL DEFAULT 2025,
  -- Shared
  games       integer DEFAULT 0,
  -- NFL
  pass_yards  integer,
  pass_tds    integer,
  interceptions integer,
  rush_yards  integer,
  rush_tds    integer,
  receptions  integer,
  rec_yards   integer,
  rec_tds     integer,
  fg_made     integer,
  fg_att      integer,
  sacks       numeric(4,1),
  def_tds     integer,
  -- MLB hitter
  avg         numeric(5,3),
  hr          integer,
  rbi         integer,
  runs        integer,
  sb          integer,
  obp         numeric(5,3),
  slg         numeric(5,3),
  -- MLB pitcher
  era         numeric(4,2),
  wins        integer,
  k           integer,
  saves       integer,
  whip        numeric(4,2),
  ip          numeric(5,1),
  -- NBA
  pts         numeric(4,1),
  reb         numeric(4,1),
  ast         numeric(4,1),
  stl         numeric(4,1),
  blk         numeric(4,1),
  three_pm    numeric(4,1),
  fg_pct      numeric(4,3),
  ft_pct      numeric(4,3),
  "to"        numeric(4,1),
  -- NHL
  goals       integer,
  assists     integer,
  points      integer,
  plus_minus  integer,
  pim         integer,
  shots       integer,
  -- NHL goalie
  gaa         numeric(4,2),
  sv_pct      numeric(5,3),
  shutouts    integer,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(player_id, season)
);

CREATE INDEX idx_player_stats_player ON player_stats(player_id);
CREATE INDEX idx_player_stats_season ON player_stats(season);

ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "player_stats_public_read" ON player_stats FOR SELECT USING (true);
