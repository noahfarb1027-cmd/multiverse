import type { Sport } from '@/types/database'

export interface RosterSlot {
  slot: string
  label: string
  positions: string[]
  count: number
}

export interface StatCategory {
  key: string
  label: string
  format: 'int' | 'decimal' | 'percent' | 'ratio'
}

export interface SportConfig {
  color: string
  accentClass: string
  positions: string[]
  rosterSlots: RosterSlot[]
  statCategories: StatCategory[]
  hitterCategories?: StatCategory[]
  pitcherCategories?: StatCategory[]
}

export const SPORTS: Record<Sport, SportConfig> = {
  NFL: {
    color: '#2563eb',
    accentClass: 'text-nfl',
    positions: ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'],
    rosterSlots: [
      { slot: 'QB',   label: 'Quarterback',   positions: ['QB'],           count: 1 },
      { slot: 'RB1',  label: 'Running Back',  positions: ['RB'],           count: 1 },
      { slot: 'RB2',  label: 'Running Back',  positions: ['RB'],           count: 1 },
      { slot: 'WR1',  label: 'Wide Receiver', positions: ['WR'],           count: 1 },
      { slot: 'WR2',  label: 'Wide Receiver', positions: ['WR'],           count: 1 },
      { slot: 'TE',   label: 'Tight End',     positions: ['TE'],           count: 1 },
      { slot: 'FLEX', label: 'Flex',          positions: ['RB','WR','TE'], count: 1 },
      { slot: 'K',    label: 'Kicker',        positions: ['K'],            count: 1 },
      { slot: 'DEF',  label: 'Defense',       positions: ['DEF'],          count: 1 },
      { slot: 'BN1',  label: 'Bench',         positions: ['QB','RB','WR','TE','K','DEF'], count: 1 },
      { slot: 'BN2',  label: 'Bench',         positions: ['QB','RB','WR','TE','K','DEF'], count: 1 },
      { slot: 'BN3',  label: 'Bench',         positions: ['QB','RB','WR','TE','K','DEF'], count: 1 },
      { slot: 'BN4',  label: 'Bench',         positions: ['QB','RB','WR','TE','K','DEF'], count: 1 },
      { slot: 'BN5',  label: 'Bench',         positions: ['QB','RB','WR','TE','K','DEF'], count: 1 },
      { slot: 'BN6',  label: 'Bench',         positions: ['QB','RB','WR','TE','K','DEF'], count: 1 },
    ],
    statCategories: [
      { key: 'pass_yards',   label: 'Pass Yds',   format: 'int' },
      { key: 'pass_tds',     label: 'Pass TDs',   format: 'int' },
      { key: 'interceptions',label: 'INTs',       format: 'int' },
      { key: 'rush_yards',   label: 'Rush Yds',   format: 'int' },
      { key: 'rush_tds',     label: 'Rush TDs',   format: 'int' },
      { key: 'receptions',   label: 'REC',        format: 'int' },
      { key: 'rec_yards',    label: 'Rec Yds',    format: 'int' },
      { key: 'rec_tds',      label: 'Rec TDs',    format: 'int' },
      { key: 'fg_made',      label: 'FGM',        format: 'int' },
      { key: 'sacks',        label: 'Sacks',      format: 'decimal' },
      { key: 'def_tds',      label: 'Def TDs',    format: 'int' },
    ],
  },

  MLB: {
    color: '#dc2626',
    accentClass: 'text-mlb',
    positions: ['SP', 'RP', 'C', '1B', '2B', '3B', 'SS', 'OF', 'DH'],
    rosterSlots: [
      { slot: 'C',    label: 'Catcher',      positions: ['C'],                         count: 1 },
      { slot: '1B',   label: 'First Base',   positions: ['1B'],                        count: 1 },
      { slot: '2B',   label: 'Second Base',  positions: ['2B'],                        count: 1 },
      { slot: '3B',   label: 'Third Base',   positions: ['3B'],                        count: 1 },
      { slot: 'SS',   label: 'Shortstop',    positions: ['SS'],                        count: 1 },
      { slot: 'OF1',  label: 'Outfield',     positions: ['OF'],                        count: 1 },
      { slot: 'OF2',  label: 'Outfield',     positions: ['OF'],                        count: 1 },
      { slot: 'OF3',  label: 'Outfield',     positions: ['OF'],                        count: 1 },
      { slot: 'DH',   label: 'Util/DH',      positions: ['C','1B','2B','3B','SS','OF','DH'], count: 1 },
      { slot: 'SP1',  label: 'Starting P',   positions: ['SP'],                        count: 1 },
      { slot: 'SP2',  label: 'Starting P',   positions: ['SP'],                        count: 1 },
      { slot: 'SP3',  label: 'Starting P',   positions: ['SP'],                        count: 1 },
      { slot: 'RP1',  label: 'Relief P',     positions: ['RP'],                        count: 1 },
      { slot: 'RP2',  label: 'Relief P',     positions: ['RP'],                        count: 1 },
      { slot: 'BN1',  label: 'Bench',        positions: ['SP','RP','C','1B','2B','3B','SS','OF','DH'], count: 1 },
    ],
    statCategories: [
      { key: 'avg',   label: 'AVG',   format: 'ratio'   },
      { key: 'hr',    label: 'HR',    format: 'int'     },
      { key: 'rbi',   label: 'RBI',   format: 'int'     },
      { key: 'runs',  label: 'R',     format: 'int'     },
      { key: 'sb',    label: 'SB',    format: 'int'     },
      { key: 'obp',   label: 'OBP',   format: 'ratio'   },
      { key: 'slg',   label: 'SLG',   format: 'ratio'   },
    ],
    pitcherCategories: [
      { key: 'era',   label: 'ERA',   format: 'decimal' },
      { key: 'wins',  label: 'W',     format: 'int'     },
      { key: 'k',     label: 'K',     format: 'int'     },
      { key: 'saves', label: 'SV',    format: 'int'     },
      { key: 'whip',  label: 'WHIP',  format: 'decimal' },
      { key: 'ip',    label: 'IP',    format: 'decimal' },
    ],
  },

  NBA: {
    color: '#ea580c',
    accentClass: 'text-nba',
    positions: ['PG', 'SG', 'SF', 'PF', 'C'],
    rosterSlots: [
      { slot: 'PG',    label: 'Point Guard',   positions: ['PG'],           count: 1 },
      { slot: 'SG',    label: 'Shoot Guard',   positions: ['SG'],           count: 1 },
      { slot: 'SF',    label: 'Small Forward', positions: ['SF'],           count: 1 },
      { slot: 'PF',    label: 'Power Forward', positions: ['PF'],           count: 1 },
      { slot: 'C',     label: 'Center',        positions: ['C'],            count: 1 },
      { slot: 'G',     label: 'Guard Flex',    positions: ['PG','SG'],      count: 1 },
      { slot: 'F',     label: 'Forward Flex',  positions: ['SF','PF'],      count: 1 },
      { slot: 'UTIL',  label: 'Utility',       positions: ['PG','SG','SF','PF','C'], count: 1 },
      { slot: 'BN1',   label: 'Bench',         positions: ['PG','SG','SF','PF','C'], count: 1 },
      { slot: 'BN2',   label: 'Bench',         positions: ['PG','SG','SF','PF','C'], count: 1 },
      { slot: 'BN3',   label: 'Bench',         positions: ['PG','SG','SF','PF','C'], count: 1 },
      { slot: 'BN4',   label: 'Bench',         positions: ['PG','SG','SF','PF','C'], count: 1 },
      { slot: 'BN5',   label: 'Bench',         positions: ['PG','SG','SF','PF','C'], count: 1 },
    ],
    statCategories: [
      { key: 'pts',     label: 'PTS',    format: 'decimal' },
      { key: 'reb',     label: 'REB',    format: 'decimal' },
      { key: 'ast',     label: 'AST',    format: 'decimal' },
      { key: 'stl',     label: 'STL',    format: 'decimal' },
      { key: 'blk',     label: 'BLK',    format: 'decimal' },
      { key: 'three_pm',label: '3PM',    format: 'decimal' },
      { key: 'fg_pct',  label: 'FG%',    format: 'percent' },
      { key: 'ft_pct',  label: 'FT%',    format: 'percent' },
      { key: 'to',      label: 'TO',     format: 'decimal' },
    ],
  },

  NHL: {
    color: '#0891b2',
    accentClass: 'text-nhl',
    positions: ['C', 'LW', 'RW', 'D', 'G'],
    rosterSlots: [
      { slot: 'C1',   label: 'Center',      positions: ['C'],           count: 1 },
      { slot: 'C2',   label: 'Center',      positions: ['C'],           count: 1 },
      { slot: 'LW1',  label: 'Left Wing',   positions: ['LW'],          count: 1 },
      { slot: 'LW2',  label: 'Left Wing',   positions: ['LW'],          count: 1 },
      { slot: 'RW1',  label: 'Right Wing',  positions: ['RW'],          count: 1 },
      { slot: 'RW2',  label: 'Right Wing',  positions: ['RW'],          count: 1 },
      { slot: 'D1',   label: 'Defense',     positions: ['D'],           count: 1 },
      { slot: 'D2',   label: 'Defense',     positions: ['D'],           count: 1 },
      { slot: 'D3',   label: 'Defense',     positions: ['D'],           count: 1 },
      { slot: 'G1',   label: 'Goalie',      positions: ['G'],           count: 1 },
      { slot: 'G2',   label: 'Goalie',      positions: ['G'],           count: 1 },
      { slot: 'IR',   label: 'IR',          positions: ['C','LW','RW','D','G'], count: 1 },
      { slot: 'BN1',  label: 'Bench',       positions: ['C','LW','RW','D','G'], count: 1 },
      { slot: 'BN2',  label: 'Bench',       positions: ['C','LW','RW','D','G'], count: 1 },
      { slot: 'BN3',  label: 'Bench',       positions: ['C','LW','RW','D','G'], count: 1 },
    ],
    statCategories: [
      { key: 'goals',   label: 'G',      format: 'int'     },
      { key: 'assists', label: 'A',      format: 'int'     },
      { key: 'points',  label: 'PTS',    format: 'int'     },
      { key: 'plus_minus', label: '+/-', format: 'int'     },
      { key: 'pim',     label: 'PIM',    format: 'int'     },
      { key: 'shots',   label: 'SOG',    format: 'int'     },
      { key: 'wins',    label: 'W',      format: 'int'     },
      { key: 'gaa',     label: 'GAA',    format: 'decimal' },
      { key: 'sv_pct',  label: 'SV%',    format: 'percent' },
      { key: 'shutouts',label: 'SO',     format: 'int'     },
    ],
  },
}

export function getPickOwner(pickNumber: number, teamOrder: string[]): string {
  const n = teamOrder.length
  if (n === 0) return ''
  const round = Math.floor((pickNumber - 1) / n)
  const posInRound = (pickNumber - 1) % n
  const teamIndex = round % 2 === 0 ? posInRound : (n - 1 - posInRound)
  return teamOrder[teamIndex]
}

export function formatStat(value: number | undefined | null, format: StatCategory['format']): string {
  if (value == null) return '—'
  switch (format) {
    case 'ratio':   return value.toFixed(3).replace(/^0/, '')
    case 'percent': return `${(value * 100).toFixed(1)}%`
    case 'decimal': return value.toFixed(2)
    case 'int':     return Math.round(value).toString()
  }
}

export function isPitcher(position: string): boolean {
  return ['SP', 'RP'].includes(position)
}
