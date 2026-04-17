'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SPORTS, getPickOwner, formatStat } from '@/lib/sports'
import { makePick, autoPickBestAvailable, toggleAutodraft } from '@/app/actions/draft'
import type { Sport } from '@/types/database'
import { Clock, User, Trophy, ChevronRight, ArrowUpDown, AlignLeft, Bot, BotOff } from 'lucide-react'

type SortMode = 'adp' | 'alpha'

interface DraftPick {
  pick_number: number
  round: number
  player_id: string
  team_id: string
  players: { name: string; position: string; sport: string } | null
  teams: { team_name: string } | null
}

interface Player {
  id: string
  name: string
  position: string
  sport: string
  team_name: string | null
  adp: number | null
}

interface Team {
  id: string
  team_name: string
  user_id: string
  autodraft: boolean
}

interface Draft {
  id: string
  status: string
  current_pick: number
  draft_order: string[]
  timer_seconds: number
  pick_clock: number
  rounds: number
  sports_included: string[]
}

const SPORT_COLORS: Record<string, string> = {
  NFL: 'text-nfl',
  MLB: 'text-mlb',
  NBA: 'text-nba',
  NHL: 'text-nhl',
}
const SPORT_BG: Record<string, string> = {
  NFL: 'bg-nfl/10 border-nfl/20',
  MLB: 'bg-mlb/10 border-mlb/20',
  NBA: 'bg-nba/10 border-nba/20',
  NHL: 'bg-nhl/10 border-nhl/20',
}

interface Props {
  leagueId: string
  currentUserId: string
  initialDraft: Draft | null
  initialPicks: DraftPick[]
  initialTeams: Team[]
  initialPlayers: Player[]
}

export default function LiveDraftRoom({
  leagueId, currentUserId,
  initialDraft, initialPicks, initialTeams, initialPlayers,
}: Props) {
  const [draft, setDraft]             = useState<Draft | null>(initialDraft)
  const [picks, setPicks]             = useState<DraftPick[]>(initialPicks)
  const [players, setPlayers]         = useState<Player[]>(initialPlayers)
  const [teams, setTeams]             = useState<Team[]>(initialTeams)
  const [search, setSearch]           = useState('')
  const [sportFilter, setSportFilter] = useState<string>('')
  const [sortMode, setSortMode]       = useState<SortMode>('adp')
  const [timeLeft, setTimeLeft]       = useState(initialDraft?.timer_seconds ?? 90)
  const [loadingPick, setLoadingPick] = useState<string | null>(null)
  const [autopicking, setAutopicking] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const supabase = createClient()
  const pickedIds = new Set(picks.map(p => p.player_id))

  const myTeam = teams.find(t => t.user_id === currentUserId)
  const currentTeamId = draft ? getPickOwner(draft.current_pick, draft.draft_order) : null
  const isMyTurn = myTeam?.id === currentTeamId
  const currentTeam = teams.find(t => t.id === currentTeamId)
  const rounds = draft?.rounds ?? 15
  const teamCount = draft?.draft_order.length ?? initialTeams.length
  const round = draft ? Math.ceil(draft.current_pick / teamCount) : 1
  const pickInRound = draft ? ((draft.current_pick - 1) % teamCount) + 1 : 1
  const totalPicks = rounds * teamCount

  // Start/reset timer whenever current_pick changes
  function resetTimer(seconds: number) {
    setTimeLeft(seconds)
    if (timerRef.current) clearInterval(timerRef.current)
    if (seconds > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!)
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
  }

  useEffect(() => {
    if (draft?.status === 'in_progress' && draft.pick_clock > 0) {
      resetTimer(draft.timer_seconds)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [draft?.current_pick, draft?.status])

  // Autodraft trigger when timer hits 0 or autodraft is on
  useEffect(() => {
    if (!draft || draft.status !== 'in_progress' || autopicking) return
    const shouldAutopick = myTeam?.autodraft && isMyTurn
    const timedOut = draft.pick_clock > 0 && timeLeft === 0 && isMyTurn
    if (shouldAutopick || timedOut) {
      setAutopicking(true)
      autoPickBestAvailable(draft.id, leagueId).finally(() => setAutopicking(false))
    }
  }, [timeLeft, isMyTurn, myTeam?.autodraft, draft?.status])

  // Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`draft:${leagueId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'drafts',
        filter: `league_id=eq.${leagueId}`,
      }, payload => {
        const d = payload.new as Draft
        setDraft(d)
        resetTimer(d.timer_seconds)
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'draft_picks',
        filter: `draft_id=eq.${draft?.id ?? 'none'}`,
      }, payload => {
        const newPick = payload.new as DraftPick
        setPicks(prev => {
          if (prev.find(p => p.pick_number === newPick.pick_number)) return prev
          return [...prev, newPick]
        })
        setPlayers(prev => prev.filter(p => p.id !== newPick.player_id))
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'teams',
        filter: `league_id=eq.${leagueId}`,
      }, payload => {
        setTeams(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...(payload.new as Team) } : t))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [leagueId, draft?.id])

  const handlePick = useCallback(async (playerId: string) => {
    if (!draft || !isMyTurn || loadingPick) return
    setLoadingPick(playerId)
    await makePick(draft.id, playerId, leagueId)
    setLoadingPick(null)
  }, [draft, isMyTurn, leagueId, loadingPick])

  const handleToggleAutodraft = useCallback(async () => {
    if (!myTeam) return
    const next = !myTeam.autodraft
    setTeams(prev => prev.map(t => t.id === myTeam.id ? { ...t, autodraft: next } : t))
    await toggleAutodraft(myTeam.id, next)
  }, [myTeam])

  const sportsAvailable = draft?.sports_included ?? ['NFL','MLB','NBA','NHL']

  const filteredPlayers = players
    .filter(p => {
      if (pickedIds.has(p.id)) return false
      if (sportFilter && p.sport !== sportFilter) return false
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sortMode === 'adp') return (a.adp ?? 999) - (b.adp ?? 999)
      return a.name.localeCompare(b.name)
    })

  const timerPct = draft?.pick_clock ? (timeLeft / draft.pick_clock) * 100 : 100
  const timerColor = timerPct > 50 ? '#22c55e' : timerPct > 20 ? '#eab308' : '#ef4444'

  if (!draft) {
    return (
      <div className="card p-8 text-center">
        <Trophy size={40} className="mx-auto mb-4 text-brand" />
        <h2 className="text-xl font-bold text-white mb-2">Draft Not Started</h2>
        <p className="text-slate-400">Configure settings above and start the draft when ready.</p>
      </div>
    )
  }

  if (draft.status === 'completed') {
    return (
      <div className="card p-8 text-center">
        <Trophy size={40} className="mx-auto mb-4 text-yellow-400" />
        <h2 className="text-xl font-bold text-white mb-2">Draft Complete!</h2>
        <p className="text-slate-400">All {picks.length} picks have been made. Good luck this season!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Status bar */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <span className="section-label">Round {round}/{rounds}</span>
            <span className="text-slate-600 mx-2">·</span>
            <span className="section-label">Pick {pickInRound}/{teamCount}</span>
            <span className="text-slate-600 mx-2">·</span>
            <span className="section-label">Overall #{draft.current_pick}/{totalPicks}</span>
          </div>
          {isMyTurn && !myTeam?.autodraft && (
            <span className="badge bg-brand/20 text-brand-light border border-brand/30 animate-pulse">
              Your Pick!
            </span>
          )}
          {myTeam?.autodraft && isMyTurn && (
            <span className="badge bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
              Autodraft Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Autodraft toggle */}
          {myTeam && (
            <button
              onClick={handleToggleAutodraft}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                myTeam.autodraft
                  ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-300'
                  : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              {myTeam.autodraft ? <Bot size={13} /> : <BotOff size={13} />}
              Autodraft {myTeam.autodraft ? 'ON' : 'OFF'}
            </button>
          )}

          {/* Timer */}
          {draft.pick_clock > 0 ? (
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8">
                <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <circle
                    cx="16" cy="16" r="13" fill="none"
                    stroke={timerColor} strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 13}`}
                    strokeDashoffset={`${2 * Math.PI * 13 * (1 - timerPct / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
              </div>
              <span className="font-mono text-sm font-bold" style={{ color: timerColor }}>
                {draft.pick_clock >= 60
                  ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`
                  : `${timeLeft}s`}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12} /> No limit</span>
          )}
        </div>
      </div>

      {/* On the clock */}
      <div className="card px-4 py-3 flex items-center gap-2">
        <User size={16} className="text-brand shrink-0" />
        <span className="text-slate-400 text-sm">On the clock:</span>
        <span className={`font-semibold text-sm ${isMyTurn ? 'text-brand-light' : 'text-white'}`}>
          {currentTeam?.team_name ?? '—'}
        </span>
        {autopicking && (
          <span className="ml-auto text-xs text-yellow-400 animate-pulse">Auto-picking…</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Available players */}
        <div className="lg:col-span-2 card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Available Players</h3>
            <div className="flex items-center gap-1 rounded-lg bg-surface-3 p-0.5">
              <button
                onClick={() => setSortMode('adp')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  sortMode === 'adp' ? 'bg-brand/20 text-brand-light' : 'text-slate-500 hover:text-white'
                }`}
              >
                <ArrowUpDown size={11} /> ADP
              </button>
              <button
                onClick={() => setSortMode('alpha')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  sortMode === 'alpha' ? 'bg-brand/20 text-brand-light' : 'text-slate-500 hover:text-white'
                }`}
              >
                <AlignLeft size={11} /> A-Z
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <input
              className="input flex-1 text-sm py-1.5"
              placeholder="Search players…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Sport pills */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSportFilter('')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                sportFilter === '' ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-slate-500 hover:text-slate-300'
              }`}
            >
              All
            </button>
            {sportsAvailable.map(s => (
              <button
                key={s}
                onClick={() => setSportFilter(sportFilter === s ? '' : s)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                  sportFilter === s ? SPORT_BG[s] + ' ' + SPORT_COLORS[s] : 'border-white/10 text-slate-500 hover:text-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Player list */}
          <div className="space-y-0.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredPlayers.slice(0, 80).map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-surface-3 transition-colors group"
              >
                <span className="text-slate-600 text-xs w-5 text-right shrink-0">
                  {sortMode === 'adp' && player.adp != null ? Math.round(player.adp) : idx + 1}
                </span>
                <span className={`text-xs font-bold shrink-0 w-10 ${SPORT_COLORS[player.sport]}`}>
                  {player.sport}
                </span>
                <span className="badge text-xs shrink-0">{player.position}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{player.name}</p>
                  {player.team_name && <p className="text-xs text-slate-500 truncate">{player.team_name}</p>}
                </div>
                {isMyTurn && !myTeam?.autodraft && (
                  <button
                    onClick={() => handlePick(player.id)}
                    disabled={loadingPick === player.id}
                    className="btn-primary text-xs px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    {loadingPick === player.id ? '…' : 'Draft'}
                  </button>
                )}
              </div>
            ))}
            {filteredPlayers.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">No players match your filters</p>
            )}
          </div>
        </div>

        {/* Pick history */}
        <div className="card p-4 flex flex-col">
          <h3 className="text-white font-semibold mb-3 shrink-0">Pick History</h3>
          <div className="space-y-0.5 overflow-y-auto flex-1 max-h-[500px]">
            {[...picks].reverse().map(pick => (
              <div key={pick.pick_number} className="flex items-start gap-2 text-sm py-1.5 border-b border-white/[0.04]">
                <span className="text-slate-600 font-mono text-xs w-5 text-right shrink-0 mt-0.5">{pick.pick_number}</span>
                <div className="min-w-0">
                  <p className="text-white text-xs font-medium truncate">
                    {pick.players?.name ?? '—'}
                    {pick.players?.sport && (
                      <span className={`ml-1.5 text-xs ${SPORT_COLORS[pick.players.sport]}`}>
                        {pick.players.sport}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {pick.teams?.team_name} · {pick.players?.position}
                  </p>
                </div>
              </div>
            ))}
            {picks.length === 0 && (
              <p className="text-slate-500 text-xs text-center py-8">No picks yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Draft board */}
      <div className="card p-4 overflow-x-auto">
        <h3 className="text-white font-semibold mb-3">Draft Board</h3>
        <div
          className="grid gap-1 min-w-max"
          style={{ gridTemplateColumns: `repeat(${Math.min(teamCount, 12)}, minmax(100px, 1fr))` }}
        >
          {teams.map(team => (
            <div key={team.id} className="text-center">
              <p className={`text-xs font-semibold truncate px-1 mb-1 ${team.user_id === currentUserId ? 'text-brand-light' : 'text-slate-400'}`}>
                {team.team_name}
                {team.autodraft && <span className="ml-1 text-yellow-400 text-xs">🤖</span>}
              </p>
              {Array.from({ length: rounds }).map((_, roundIdx) => {
                const roundNum = roundIdx + 1
                const order = draft.draft_order
                const n = order.length
                const teamIdx = order.indexOf(team.id)
                const isEvenRound = roundNum % 2 === 1
                const offset = isEvenRound ? teamIdx : (n - 1 - teamIdx)
                const pickNum = (roundIdx * n) + offset + 1
                const pick = picks.find(p => p.pick_number === pickNum)
                const isCurrent = pickNum === draft.current_pick

                return (
                  <div
                    key={roundIdx}
                    title={pick ? `${pick.players?.name} (${pick.players?.sport})` : `Pick #${pickNum}`}
                    className={`text-xs rounded px-1 py-0.5 mb-0.5 truncate cursor-default ${
                      pick
                        ? `${SPORT_BG[pick.players?.sport ?? 'NFL']} ${SPORT_COLORS[pick.players?.sport ?? 'NFL']}`
                        : isCurrent
                        ? 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/40'
                        : 'bg-surface-2 text-slate-700'
                    }`}
                  >
                    {pick
                      ? pick.players?.name?.split(' ').pop() ?? '—'
                      : isCurrent ? '◆' : pickNum}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
