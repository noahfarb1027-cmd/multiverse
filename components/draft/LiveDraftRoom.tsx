'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SPORTS, getPickOwner, formatStat } from '@/lib/sports'
import { makePick } from '@/app/actions/draft'
import type { Sport } from '@/types/database'
import { Clock, User, Trophy, ChevronRight } from 'lucide-react'

interface DraftPick {
  pick_number: number
  round: number
  player_id: string
  team_id: string
  players: { name: string; position: string }
  teams: { name: string }
}

interface Player {
  id: string
  name: string
  position: string
  team: string | null
}

interface Team {
  id: string
  team_name: string
  user_id: string
}

interface Draft {
  id: string
  status: string
  current_pick: number
  draft_order: string[]
  timer_seconds: number
}

interface Props {
  leagueId: string
  sport: Sport
  currentUserId: string
  initialDraft: Draft | null
  initialPicks: DraftPick[]
  initialTeams: Team[]
  initialPlayers: Player[]
}

export default function LiveDraftRoom({
  leagueId, sport, currentUserId,
  initialDraft, initialPicks, initialTeams, initialPlayers,
}: Props) {
  const [draft, setDraft]       = useState<Draft | null>(initialDraft)
  const [picks, setPicks]       = useState<DraftPick[]>(initialPicks)
  const [players, setPlayers]   = useState<Player[]>(initialPlayers)
  const [search, setSearch]     = useState('')
  const [posFilter, setPosFilter] = useState('')
  const [timeLeft, setTimeLeft] = useState(initialDraft?.timer_seconds ?? 90)
  const [loading, setLoading]   = useState<string | null>(null)

  const supabase = createClient()
  const config   = SPORTS[sport]
  const pickedIds = new Set(picks.map(p => p.player_id))

  const myTeam = initialTeams.find(t => t.user_id === currentUserId)
  const currentTeamId = draft ? getPickOwner(draft.current_pick, draft.draft_order) : null
  const isMyTurn = myTeam?.id === currentTeamId
  const currentTeam = initialTeams.find(t => t.id === currentTeamId)
  const round = draft ? Math.ceil(draft.current_pick / (draft.draft_order.length || 1)) : 1
  const pickInRound = draft ? ((draft.current_pick - 1) % (draft.draft_order.length || 1)) + 1 : 1

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`draft:${leagueId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'drafts',
        filter: `league_id=eq.${leagueId}`,
      }, payload => {
        setDraft(payload.new as Draft)
        setTimeLeft((payload.new as Draft).timer_seconds)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'draft_picks',
        filter: `draft_id=eq.${draft?.id}`,
      }, payload => {
        const newPick = payload.new as DraftPick
        setPicks(prev => [...prev, newPick])
        setPlayers(prev => prev.filter(p => p.id !== newPick.player_id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [leagueId, draft?.id])

  // Countdown timer
  useEffect(() => {
    if (!draft || draft.status !== 'in_progress') return
    const interval = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [draft?.current_pick, draft?.status])

  const handlePick = useCallback(async (playerId: string) => {
    if (!draft || !isMyTurn) return
    setLoading(playerId)
    await makePick(draft.id, playerId, leagueId)
    setLoading(null)
  }, [draft, isMyTurn, leagueId])

  const filteredPlayers = players.filter(p => {
    if (pickedIds.has(p.id)) return false
    if (posFilter && p.position !== posFilter) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const timerColor = timeLeft > 30 ? 'text-green-400' : timeLeft > 10 ? 'text-yellow-400' : 'text-red-400'

  if (!draft) {
    return (
      <div className="card p-8 text-center">
        <Trophy size={40} className="mx-auto mb-4 text-brand" />
        <h2 className="text-xl font-bold text-white mb-2">Draft Not Started</h2>
        <p className="text-slate-400">The commissioner will start the draft when all teams are ready.</p>
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Draft status bar */}
      <div className="lg:col-span-3 card p-4 flex items-center justify-between">
        <div>
          <span className="section-label">Round {round}</span>
          <span className="text-slate-500 mx-2">·</span>
          <span className="section-label">Pick {pickInRound} of {draft.draft_order.length}</span>
          <span className="text-slate-500 mx-2">·</span>
          <span className="section-label">Overall #{draft.current_pick}</span>
        </div>
        <div className="flex items-center gap-3">
          {isMyTurn && (
            <span className="badge bg-brand/20 text-brand-light border border-brand/30">Your Pick!</span>
          )}
          <div className={`flex items-center gap-1.5 font-mono text-lg font-bold ${timerColor}`}>
            <Clock size={18} />
            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* On the clock */}
      <div className="lg:col-span-3 card p-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <User size={18} className="text-brand" />
          <span>On the Clock:</span>
          <span className={`ml-1 ${isMyTurn ? 'text-brand-light' : 'text-slate-300'}`}>
            {currentTeam?.team_name ?? '—'}
          </span>
        </div>
      </div>

      {/* Available players */}
      <div className="lg:col-span-2 space-y-3">
        <div className="card p-4">
          <h3 className="text-white font-semibold mb-3">Available Players</h3>
          <div className="flex gap-2 mb-3">
            <input
              className="input flex-1 text-sm py-1.5"
              placeholder="Search players…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="input text-sm py-1.5"
              value={posFilter}
              onChange={e => setPosFilter(e.target.value)}
            >
              <option value="">All</option>
              {config.positions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
            {filteredPlayers.slice(0, 50).map(player => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 bg-surface-2 hover:bg-surface-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="badge text-xs">{player.position}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{player.name}</p>
                    {player.team && <p className="text-xs text-slate-500">{player.team}</p>}
                  </div>
                </div>
                {isMyTurn && (
                  <button
                    onClick={() => handlePick(player.id)}
                    disabled={loading === player.id}
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    {loading === player.id ? '…' : 'Draft'}
                  </button>
                )}
              </div>
            ))}
            {filteredPlayers.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">No players match your filters</p>
            )}
          </div>
        </div>
      </div>

      {/* Pick history */}
      <div className="card p-4">
        <h3 className="text-white font-semibold mb-3">Recent Picks</h3>
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {[...picks].reverse().slice(0, 30).map(pick => (
            <div key={pick.pick_number} className="flex items-center gap-2 text-sm py-1.5 border-b border-white/5">
              <span className="text-slate-500 w-6 text-right shrink-0">{pick.pick_number}</span>
              <ChevronRight size={12} className="text-slate-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-white truncate">{pick.players?.name ?? '—'}</p>
                <p className="text-xs text-slate-500 truncate">{pick.teams?.name} · {pick.players?.position}</p>
              </div>
            </div>
          ))}
          {picks.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">No picks yet</p>
          )}
        </div>
      </div>

      {/* Draft board grid */}
      <div className="lg:col-span-3 card p-4 overflow-x-auto">
        <h3 className="text-white font-semibold mb-3">Draft Board</h3>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(initialTeams.length, 12)}, minmax(120px, 1fr))` }}>
          {initialTeams.map(team => (
            <div key={team.id} className="text-center">
              <p className="text-xs font-medium text-slate-400 truncate px-1 mb-1">{team.team_name}</p>
              {Array.from({ length: 15 }).map((_, i) => {
                const pickNum = draft.draft_order.indexOf(team.id) !== -1
                  ? (() => {
                      const slot = i + 1
                      const order = draft.draft_order as string[]
                      const n = order.length
                      const roundStart = (slot - 1) * n
                      const isEven = (slot - 1) % 2 === 0
                      const teamIdx = order.indexOf(team.id)
                      const offset = isEven ? teamIdx : (n - 1 - teamIdx)
                      return roundStart + offset + 1
                    })()
                  : null
                const pick = picks.find(p => p.pick_number === pickNum)
                return (
                  <div
                    key={i}
                    className={`text-xs rounded px-1 py-0.5 mb-0.5 truncate ${
                      pick
                        ? 'bg-brand/20 text-brand-light'
                        : pickNum === draft.current_pick
                        ? 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/40'
                        : 'bg-surface-2 text-slate-600'
                    }`}
                  >
                    {pick ? pick.players?.name?.split(' ').pop() ?? '—' : pickNum === draft.current_pick ? '◆' : pickNum ?? '—'}
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
