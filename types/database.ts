export type Sport = 'MLB' | 'NFL' | 'NBA' | 'NHL'
export type LeagueStatus = 'setup' | 'drafting' | 'active' | 'completed'
export type DraftStatus = 'pending' | 'in_progress' | 'completed'
export type TradeStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'
export type WaiverStatus = 'pending' | 'processed' | 'cancelled'
export type MatchupStatus = 'scheduled' | 'in_progress' | 'completed'
export type PlayerStatus = 'active' | 'injured' | 'inactive'
export type TransactionType = 'add' | 'drop' | 'trade' | 'waiver_claim'
export type AcquisitionType = 'draft' | 'waiver' | 'trade' | 'free_agent'

export interface User {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface League {
  id: string
  name: string
  commissioner_id: string
  invite_code: string
  team_count: number
  status: LeagueStatus
  draft_pick_count: number
  created_at: string
}

export interface Team {
  id: string
  league_id: string
  user_id: string
  team_name: string
  wins: number
  losses: number
  points_for: number
  points_against: number
}

export interface Player {
  id: string
  name: string
  sport: Sport
  team_name: string
  position: string
  msf_player_id: string | null
  status: PlayerStatus
}

export interface Roster {
  id: string
  team_id: string
  player_id: string
  slot: string
  sport: Sport
  acquired_at: string
  acquisition_type: AcquisitionType
}

export interface Draft {
  id: string
  league_id: string
  status: DraftStatus
  current_pick: number
  round: number
  started_at: string | null
}

export interface DraftPick {
  id: string
  draft_id: string
  team_id: string
  player_id: string
  pick_number: number
  round: number
  picked_at: string
}

export interface Trade {
  id: string
  league_id: string
  proposing_team_id: string
  receiving_team_id: string
  status: TradeStatus
  proposed_at: string
  resolved_at: string | null
}

export interface TradeAsset {
  id: string
  trade_id: string
  player_id: string
  from_team_id: string
  to_team_id: string
  sport: Sport
}

export interface Matchup {
  id: string
  league_id: string
  home_team_id: string
  away_team_id: string
  week: number
  home_score: number
  away_score: number
  status: MatchupStatus
}

export interface Transaction {
  id: string
  league_id: string
  team_id: string
  player_id: string
  type: TransactionType
  created_at: string
}

export interface ScoringSettings {
  id: string
  league_id: string
  sport: Sport
  stat_category: string
  points_per_unit: number
}

export interface Waiver {
  id: string
  league_id: string
  team_id: string
  player_id: string
  priority: number
  status: WaiverStatus
  submitted_at: string
}
