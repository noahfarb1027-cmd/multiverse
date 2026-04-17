-- ============================================================
-- Migration: Row Level Security Policies
-- ============================================================
-- Core principle: a user can access data in a league only if
-- they own a team in that league (or are the commissioner).
-- Players are readable by all authenticated users.
-- ============================================================

-- Reusable helper: true when auth.uid() owns a team in :league_id
-- Used inline in policies to avoid cross-schema function overhead.

-- ============================================================
-- USERS
-- ============================================================
alter table public.users enable row level security;

create policy "users_select_own"
  on public.users for select
  using (id = auth.uid());

create policy "users_insert_own"
  on public.users for insert
  with check (id = auth.uid());

create policy "users_update_own"
  on public.users for update
  using (id = auth.uid());

-- ============================================================
-- LEAGUES
-- ============================================================
alter table public.leagues enable row level security;

-- Members of a league (have a team) can read it; commissioner always can
create policy "leagues_select_member"
  on public.leagues for select
  using (
    commissioner_id = auth.uid()
    or exists (
      select 1 from public.teams t
      where t.league_id = id and t.user_id = auth.uid()
    )
  );

create policy "leagues_insert_commissioner"
  on public.leagues for insert
  with check (commissioner_id = auth.uid());

create policy "leagues_update_commissioner"
  on public.leagues for update
  using (commissioner_id = auth.uid());

create policy "leagues_delete_commissioner"
  on public.leagues for delete
  using (commissioner_id = auth.uid());

-- ============================================================
-- TEAMS
-- ============================================================
alter table public.teams enable row level security;

-- Any league member can see all teams in their league
create policy "teams_select_league_member"
  on public.teams for select
  using (
    exists (
      select 1 from public.teams t2
      where t2.league_id = league_id and t2.user_id = auth.uid()
    )
  );

create policy "teams_insert_own"
  on public.teams for insert
  with check (user_id = auth.uid());

create policy "teams_update_own"
  on public.teams for update
  using (user_id = auth.uid());

create policy "teams_delete_own"
  on public.teams for delete
  using (user_id = auth.uid());

-- ============================================================
-- PLAYERS  (global read — no league restriction)
-- ============================================================
alter table public.players enable row level security;

create policy "players_select_authenticated"
  on public.players for select
  to authenticated
  using (true);

-- Only service role / admins insert/update players (via server-side jobs)

-- ============================================================
-- ROSTERS
-- ============================================================
alter table public.rosters enable row level security;

create policy "rosters_select_league_member"
  on public.rosters for select
  using (
    exists (
      select 1 from public.teams t
      join public.teams t2 on t2.league_id = t.league_id
      where t.id = team_id and t2.user_id = auth.uid()
    )
  );

create policy "rosters_insert_own_team"
  on public.rosters for insert
  with check (
    exists (
      select 1 from public.teams t
      where t.id = team_id and t.user_id = auth.uid()
    )
  );

create policy "rosters_update_own_team"
  on public.rosters for update
  using (
    exists (
      select 1 from public.teams t
      where t.id = team_id and t.user_id = auth.uid()
    )
  );

create policy "rosters_delete_own_team"
  on public.rosters for delete
  using (
    exists (
      select 1 from public.teams t
      where t.id = team_id and t.user_id = auth.uid()
    )
  );

-- ============================================================
-- DRAFTS
-- ============================================================
alter table public.drafts enable row level security;

create policy "drafts_select_league_member"
  on public.drafts for select
  using (
    exists (
      select 1 from public.teams t
      where t.league_id = league_id and t.user_id = auth.uid()
    )
    or exists (
      select 1 from public.leagues l
      where l.id = league_id and l.commissioner_id = auth.uid()
    )
  );

create policy "drafts_insert_commissioner"
  on public.drafts for insert
  with check (
    exists (
      select 1 from public.leagues l
      where l.id = league_id and l.commissioner_id = auth.uid()
    )
  );

create policy "drafts_update_commissioner"
  on public.drafts for update
  using (
    exists (
      select 1 from public.leagues l
      where l.id = league_id and l.commissioner_id = auth.uid()
    )
  );

-- ============================================================
-- DRAFT_PICKS
-- ============================================================
alter table public.draft_picks enable row level security;

create policy "draft_picks_select_league_member"
  on public.draft_picks for select
  using (
    exists (
      select 1 from public.drafts d
      join public.teams t on t.league_id = d.league_id
      where d.id = draft_id and t.user_id = auth.uid()
    )
  );

create policy "draft_picks_insert_own_team"
  on public.draft_picks for insert
  with check (
    exists (
      select 1 from public.teams t
      where t.id = team_id and t.user_id = auth.uid()
    )
  );

-- ============================================================
-- TRADES
-- ============================================================
alter table public.trades enable row level security;

create policy "trades_select_league_member"
  on public.trades for select
  using (
    exists (
      select 1 from public.teams t
      where t.league_id = league_id and t.user_id = auth.uid()
    )
  );

create policy "trades_insert_own_team"
  on public.trades for insert
  with check (
    exists (
      select 1 from public.teams t
      where t.id = proposing_team_id and t.user_id = auth.uid()
    )
  );

create policy "trades_update_involved_team"
  on public.trades for update
  using (
    exists (
      select 1 from public.teams t
      where t.id in (proposing_team_id, receiving_team_id)
        and t.user_id = auth.uid()
    )
  );

-- ============================================================
-- TRADE_ASSETS
-- ============================================================
alter table public.trade_assets enable row level security;

create policy "trade_assets_select_league_member"
  on public.trade_assets for select
  using (
    exists (
      select 1 from public.trades tr
      join public.teams t on t.league_id = tr.league_id
      where tr.id = trade_id and t.user_id = auth.uid()
    )
  );

create policy "trade_assets_insert_own_team"
  on public.trade_assets for insert
  with check (
    exists (
      select 1 from public.teams t
      where t.id = from_team_id and t.user_id = auth.uid()
    )
  );

-- ============================================================
-- MATCHUPS
-- ============================================================
alter table public.matchups enable row level security;

create policy "matchups_select_league_member"
  on public.matchups for select
  using (
    exists (
      select 1 from public.teams t
      where t.league_id = league_id and t.user_id = auth.uid()
    )
  );

create policy "matchups_insert_commissioner"
  on public.matchups for insert
  with check (
    exists (
      select 1 from public.leagues l
      where l.id = league_id and l.commissioner_id = auth.uid()
    )
  );

create policy "matchups_update_commissioner"
  on public.matchups for update
  using (
    exists (
      select 1 from public.leagues l
      where l.id = league_id and l.commissioner_id = auth.uid()
    )
  );

-- ============================================================
-- TRANSACTIONS
-- ============================================================
alter table public.transactions enable row level security;

create policy "transactions_select_league_member"
  on public.transactions for select
  using (
    exists (
      select 1 from public.teams t
      where t.league_id = league_id and t.user_id = auth.uid()
    )
  );

create policy "transactions_insert_own_team"
  on public.transactions for insert
  with check (
    exists (
      select 1 from public.teams t
      where t.id = team_id and t.user_id = auth.uid()
    )
  );

-- ============================================================
-- SCORING_SETTINGS
-- ============================================================
alter table public.scoring_settings enable row level security;

create policy "scoring_settings_select_league_member"
  on public.scoring_settings for select
  using (
    exists (
      select 1 from public.teams t
      where t.league_id = league_id and t.user_id = auth.uid()
    )
    or exists (
      select 1 from public.leagues l
      where l.id = league_id and l.commissioner_id = auth.uid()
    )
  );

create policy "scoring_settings_insert_commissioner"
  on public.scoring_settings for insert
  with check (
    exists (
      select 1 from public.leagues l
      where l.id = league_id and l.commissioner_id = auth.uid()
    )
  );

create policy "scoring_settings_update_commissioner"
  on public.scoring_settings for update
  using (
    exists (
      select 1 from public.leagues l
      where l.id = league_id and l.commissioner_id = auth.uid()
    )
  );

create policy "scoring_settings_delete_commissioner"
  on public.scoring_settings for delete
  using (
    exists (
      select 1 from public.leagues l
      where l.id = league_id and l.commissioner_id = auth.uid()
    )
  );

-- ============================================================
-- WAIVERS
-- ============================================================
alter table public.waivers enable row level security;

create policy "waivers_select_league_member"
  on public.waivers for select
  using (
    exists (
      select 1 from public.teams t
      where t.league_id = league_id and t.user_id = auth.uid()
    )
  );

create policy "waivers_insert_own_team"
  on public.waivers for insert
  with check (
    exists (
      select 1 from public.teams t
      where t.id = team_id and t.user_id = auth.uid()
    )
  );

create policy "waivers_update_own_team"
  on public.waivers for update
  using (
    exists (
      select 1 from public.teams t
      where t.id = team_id and t.user_id = auth.uid()
    )
  );

create policy "waivers_delete_own_team"
  on public.waivers for delete
  using (
    exists (
      select 1 from public.teams t
      where t.id = team_id and t.user_id = auth.uid()
    )
  );
