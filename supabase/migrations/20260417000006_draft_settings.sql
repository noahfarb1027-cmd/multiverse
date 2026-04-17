-- ADP on players
ALTER TABLE players ADD COLUMN IF NOT EXISTS adp numeric(5,1);

-- Draft configuration columns
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS rounds integer DEFAULT 15;
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS sports_included jsonb DEFAULT '["NFL","MLB","NBA","NHL"]'::jsonb;
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS pick_clock integer DEFAULT 90;

-- Autodraft per team
ALTER TABLE teams ADD COLUMN IF NOT EXISTS autodraft boolean DEFAULT false;
