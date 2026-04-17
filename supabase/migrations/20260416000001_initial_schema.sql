-- ============================================================
-- Migration: Initial Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- USERS (mirrors Supabase auth.users — profile data only)
-- ============================================================
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- LEAGUES
-- ============================================================
create table public.leagues (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  commissioner_id   uuid not null references public.users(id) on delete restrict,
  invite_code       text not null unique default substring(gen_random_uuid()::text, 1, 8),
  team_count        int not null default 10,
  status            text not null default 'setup'
                      check (status in ('setup','drafting','active','completed')),
  draft_pick_count  int not null default 15,
  created_at        timestamptz not null default now()
);

-- ============================================================
-- TEAMS
-- ============================================================
create table public.teams (
  id              uuid primary key default gen_random_uuid(),
  league_id       uuid not null references public.leagues(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  team_name       text not null,
  wins            int not null default 0,
  losses          int not null default 0,
  points_for      numeric(10,2) not null default 0,
  points_against  numeric(10,2) not null default 0,
  unique (league_id, user_id)
);

-- ============================================================
-- PLAYERS
-- ============================================================
create table public.players (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  sport          text not null check (sport in ('MLB','NFL','NBA','NHL')),
  team_name      text not null,
  position       text not null,
  msf_player_id  text unique,
  status         text not null default 'active'
                   check (status in ('active','injured','inactive'))
);

-- ============================================================
-- ROSTERS
-- ============================================================
create table public.rosters (
  id                uuid primary key default gen_random_uuid(),
  team_id           uuid not null references public.teams(id) on delete cascade,
  player_id         uuid not null references public.players(id) on delete cascade,
  slot              text not null,
  sport             text not null check (sport in ('MLB','NFL','NBA','NHL')),
  acquired_at       timestamptz not null default now(),
  acquisition_type  text not null check (acquisition_type in ('draft','waiver','trade','free_agent')),
  unique (team_id, player_id)
);

-- ============================================================
-- DRAFTS
-- ============================================================
create table public.drafts (
  id            uuid primary key default gen_random_uuid(),
  league_id     uuid not null references public.leagues(id) on delete cascade unique,
  status        text not null default 'pending'
                  check (status in ('pending','in_progress','completed')),
  current_pick  int not null default 1,
  round         int not null default 1,
  started_at    timestamptz
);

-- ============================================================
-- DRAFT_PICKS
-- ============================================================
create table public.draft_picks (
  id           uuid primary key default gen_random_uuid(),
  draft_id     uuid not null references public.drafts(id) on delete cascade,
  team_id      uuid not null references public.teams(id) on delete cascade,
  player_id    uuid not null references public.players(id) on delete cascade,
  pick_number  int not null,
  round        int not null,
  picked_at    timestamptz not null default now(),
  unique (draft_id, pick_number)
);

-- ============================================================
-- TRADES
-- ============================================================
create table public.trades (
  id                  uuid primary key default gen_random_uuid(),
  league_id           uuid not null references public.leagues(id) on delete cascade,
  proposing_team_id   uuid not null references public.teams(id) on delete cascade,
  receiving_team_id   uuid not null references public.teams(id) on delete cascade,
  status              text not null default 'pending'
                        check (status in ('pending','accepted','rejected','cancelled')),
  proposed_at         timestamptz not null default now(),
  resolved_at         timestamptz
);

-- ============================================================
-- TRADE_ASSETS
-- ============================================================
create table public.trade_assets (
  id           uuid primary key default gen_random_uuid(),
  trade_id     uuid not null references public.trades(id) on delete cascade,
  player_id    uuid not null references public.players(id) on delete cascade,
  from_team_id uuid not null references public.teams(id) on delete cascade,
  to_team_id   uuid not null references public.teams(id) on delete cascade,
  sport        text not null check (sport in ('MLB','NFL','NBA','NHL'))
);

-- ============================================================
-- MATCHUPS
-- ============================================================
create table public.matchups (
  id             uuid primary key default gen_random_uuid(),
  league_id      uuid not null references public.leagues(id) on delete cascade,
  home_team_id   uuid not null references public.teams(id) on delete cascade,
  away_team_id   uuid not null references public.teams(id) on delete cascade,
  week           int not null,
  home_score     numeric(10,2) not null default 0,
  away_score     numeric(10,2) not null default 0,
  status         text not null default 'scheduled'
                   check (status in ('scheduled','in_progress','completed')),
  unique (league_id, home_team_id, away_team_id, week)
);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
create table public.transactions (
  id         uuid primary key default gen_random_uuid(),
  league_id  uuid not null references public.leagues(id) on delete cascade,
  team_id    uuid not null references public.teams(id) on delete cascade,
  player_id  uuid not null references public.players(id) on delete cascade,
  type       text not null check (type in ('add','drop','trade','waiver_claim')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- SCORING_SETTINGS
-- ============================================================
create table public.scoring_settings (
  id              uuid primary key default gen_random_uuid(),
  league_id       uuid not null references public.leagues(id) on delete cascade,
  sport           text not null check (sport in ('MLB','NFL','NBA','NHL')),
  stat_category   text not null,
  points_per_unit numeric(8,4) not null,
  unique (league_id, sport, stat_category)
);

-- ============================================================
-- WAIVERS
-- ============================================================
create table public.waivers (
  id            uuid primary key default gen_random_uuid(),
  league_id     uuid not null references public.leagues(id) on delete cascade,
  team_id       uuid not null references public.teams(id) on delete cascade,
  player_id     uuid not null references public.players(id) on delete cascade,
  priority      int not null,
  status        text not null default 'pending'
                  check (status in ('pending','processed','cancelled')),
  submitted_at  timestamptz not null default now(),
  unique (league_id, team_id, player_id)
);
