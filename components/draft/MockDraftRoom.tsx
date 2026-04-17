'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { getPickOwner } from '@/lib/sports'
import { saveMockDraft, type MockPick, type MockSettings } from '@/app/actions/mockDraft'
import {
  ArrowUpDown, AlignLeft, Bot, Trophy, Clock,
  Save, Trash2, ChevronRight, Sparkles,
} from 'lucide-react'

type SortMode = 'adp' | 'alpha'
type Phase = 'setup' | 'drafting' | 'complete'

interface Player {
  id: string
  name: string
  position: string
  sport: string
  team: string | null
  adp: number | null
}

const SPORT_COLORS: Record<string, string> = {
  NFL: 'text-nfl', MLB: 'text-mlb', NBA: 'text-nba', NHL: 'text-nhl',
}
const SPORT_BG: Record<string, string> = {
  NFL: 'bg-nfl/10 border-nfl/20', MLB: 'bg-mlb/10 border-mlb/20',
  NBA: 'bg-nba/10 border-nba/20', NHL: 'bg-nhl/10 border-nhl/20',
}
const CLOCK_OPTIONS = [
  { label: 'No Limit', value: 0 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2 min', value: 120 },
]

const CPU_PICK_DELAY = 700 // ms

interface Props { allPlayers: Player[] }

export default function MockDraftRoom({ allPlayers }: Props) {
  // Setup state
  const [numTeams, setNumTeams]   = useState(10)
  const [userSlot, setUserSlot]   = useState(1)
  const [rounds, setRounds]       = useState(15)
  const [sports, setSports]       = useState(['NFL','MLB','NBA','NHL'])
  const [pickClock, setPickClock] = useState(90)

  // Draft state
  const [phase, setPhase]           = useState<Phase>('setup')
  const [picks, setPicks]           = useState<MockPick[]>([])
  const [available, setAvailable]   = useState<Player[]>([])
  const [currentPick, setCurrentPick] = useState(1)
  const [search, setSearch]         = useState('')
  const [sportFilter, setSportFilter] = useState('')
  const [sortMode, setSortMode]     = useState<SortMode>('adp')
  const [timeLeft, setTimeLeft]     = useState(pickClock)
  const [loadingPick, setLoadingPick] = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const slots = Array.from({ length: numTeams }, (_, i) => String(i + 1))
  const totalPicks = numTeams * rounds
  const currentSlot = getPickOwner(currentPick, slots)
  const isMyTurn = currentSlot === String(userSlot)
  const round = Math.ceil(currentPick / numTeams)
  const pickInRound = ((currentPick - 1) % numTeams) + 1

  function toggleSport(s: string) {
    setSports(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function startDraft() {
    const pool = allPlayers
      .filter(p => sports.includes(p.sport))
      .sort((a, b) => (a.adp ?? 999) - (b.adp ?? 999))
    setAvailable(pool)
    setPicks([])
    setCurrentPick(1)
    setPhase('drafting')
    if (pickClock > 0) setTimeLeft(pickClock)
  }

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (pickClock <= 0) return
    setTimeLeft(pickClock)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0 }
        return t - 1
      })
    }, 1000)
  }

  function doPick(playerId: string) {
    const player = available.find(p => p.id === playerId)
    if (!player) return

    const newPick: MockPick = {
      pickNumber: currentPick,
      round: Math.ceil(currentPick / numTeams),
      playerId: player.id,
      playerName: player.name,
      playerPosition: player.position,
      playerSport: player.sport,
      playerAdp: player.adp,
      teamSlot: Number(currentSlot),
      isUserPick: currentSlot === String(userSlot),
    }

    setPicks(prev => [...prev, newPick])
    setAvailable(prev => prev.filter(p => p.id !== playerId))

    if (currentPick >= totalPicks) {
      setPhase('complete')
      if (timerRef.current) clearInterval(timerRef.current)
    } else {
      setCurrentPick(prev => prev + 1)
      resetTimer()
    }
  }

  function handleUserPick(playerId: string) {
    if (!isMyTurn || loadingPick) return
    setLoadingPick(playerId)
    doPick(playerId)
    setLoadingPick(null)
  }

  // Timer expiry → autopick for user
  useEffect(() => {
    if (phase !== 'drafting' || !isMyTurn || pickClock <= 0 || timeLeft > 0) return
    if (available.length > 0) doPick(available[0].id)
  }, [timeLeft, isMyTurn, phase])

  // CPU auto-pick
  useEffect(() => {
    if (phase !== 'drafting' || isMyTurn) return
    const t = setTimeout(() => {
      if (available.length > 0) doPick(available[0].id)
    }, CPU_PICK_DELAY)
    return () => clearTimeout(t)
  }, [currentPick, phase, isMyTurn])

  // Start timer on mount / pick change
  useEffect(() => {
    if (phase !== 'drafting' || !isMyTurn) return
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [currentPick, phase, isMyTurn])

  async function handleSave() {
    setSaving(true)
    const settings: MockSettings = { numTeams, userSlot, rounds, sports, pickClock }
    const result = await saveMockDraft(settings, picks)
    if (!result.error) setSaved(true)
    setSaving(false)
  }

  function handleReset() {
    setPhase('setup')
    setPicks([])
    setAvailable([])
    setCurrentPick(1)
    setSaved(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const filteredAvailable = available
    .filter(p => {
      if (sportFilter && p.sport !== sportFilter) return false
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) =>
      sortMode === 'adp' ? (a.adp ?? 999) - (b.adp ?? 999) : a.name.localeCompare(b.name)
    )

  const myPicks = picks.filter(p => p.isUserPick)
  const timerPct = pickClock > 0 ? (timeLeft / pickClock) * 100 : 100
  const timerColor = timerPct > 50 ? '#22c55e' : timerPct > 20 ? '#eab308' : '#ef4444'

  // ── SETUP ───────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-brand" />
            <h2 className="text-lg font-bold text-white">Mock Draft Setup</h2>
          </div>

          {/* Teams */}
          <div>
            <label className="section-label mb-2 block">Number of Teams: <span className="text-white font-bold">{numTeams}</span></label>
            <input type="range" min={2} max={16} step={1} value={numTeams}
              onChange={e => { setNumTeams(+e.target.value); setUserSlot(Math.min(userSlot, +e.target.value)) }}
              className="w-full accent-brand" />
            <div className="flex justify-between text-xs text-slate-600 mt-0.5"><span>2</span><span>16</span></div>
          </div>

          {/* Your pick slot */}
          <div>
            <label className="section-label mb-2 block">Your Draft Position: <span className="text-white font-bold">#{userSlot}</span></label>
            <div className="flex flex-wrap gap-1.5">
              {slots.map(s => (
                <button key={s} onClick={() => setUserSlot(Number(s))}
                  className={`w-9 h-9 rounded-lg text-sm font-bold border transition-all ${
                    userSlot === Number(s)
                      ? 'bg-brand/20 border-brand/40 text-brand-light'
                      : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-white'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Rounds */}
          <div>
            <label className="section-label mb-2 block">Rounds: <span className="text-white font-bold">{rounds}</span></label>
            <input type="range" min={5} max={25} step={1} value={rounds}
              onChange={e => setRounds(+e.target.value)}
              className="w-full accent-brand" />
            <p className="text-xs text-slate-500 mt-0.5">{rounds * numTeams} total picks</p>
          </div>

          {/* Pick clock */}
          <div>
            <label className="section-label mb-2 flex items-center gap-1"><Clock size={12} /> Pick Clock</label>
            <div className="flex flex-wrap gap-2">
              {CLOCK_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setPickClock(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    pickClock === opt.value
                      ? 'bg-brand/20 border-brand/40 text-brand-light'
                      : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sports */}
          <div>
            <label className="section-label mb-2 block">Player Pool</label>
            <div className="flex gap-2">
              {(['NFL','MLB','NBA','NHL'] as const).map(s => (
                <button key={s} onClick={() => toggleSport(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                    sports.includes(s)
                      ? `${SPORT_BG[s]} ${SPORT_COLORS[s]}`
                      : 'border-white/10 text-slate-600 hover:border-white/20'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button onClick={startDraft} disabled={sports.length === 0}
            className="btn-primary w-full py-3 text-base font-semibold flex items-center justify-center gap-2">
            <Sparkles size={16} /> Start Mock Draft
          </button>
        </div>
      </div>
    )
  }

  // ── COMPLETE ─────────────────────────────────────────────────────
  if (phase === 'complete') {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="card p-8 text-center">
          <Trophy size={40} className="mx-auto mb-4 text-yellow-400" />
          <h2 className="text-2xl font-bold text-white mb-1">Mock Draft Complete!</h2>
          <p className="text-slate-400 text-sm">{picks.length} picks · {rounds} rounds · {numTeams} teams</p>

          {!saved ? (
            <div className="flex gap-3 justify-center mt-6">
              <button onClick={handleSave} disabled={saving}
                className="btn-primary flex items-center gap-2 px-6 py-2.5">
                <Save size={16} />
                {saving ? 'Saving…' : 'Save to Mock History'}
              </button>
              <button onClick={handleReset}
                className="btn-secondary flex items-center gap-2 px-6 py-2.5 text-rose-400 border-rose-400/20 hover:bg-rose-400/10">
                <Trash2 size={16} /> Discard
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <p className="text-emerald-400 text-sm font-medium">✓ Saved to Mock History</p>
              <div className="flex gap-3 justify-center">
                <a href="/mock-draft/history" className="btn-secondary px-5 py-2">View History</a>
                <button onClick={handleReset} className="btn-primary px-5 py-2">New Mock Draft</button>
              </div>
            </div>
          )}
        </div>

        {/* My picks summary */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-3">Your Picks ({myPicks.length})</h3>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {myPicks.map(p => (
              <div key={p.pickNumber} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 border ${SPORT_BG[p.playerSport]}`}>
                <span className="text-slate-500 text-xs font-mono w-5">#{p.pickNumber}</span>
                <span className={`text-xs font-bold ${SPORT_COLORS[p.playerSport]}`}>{p.playerSport}</span>
                <span className="text-xs text-slate-400">{p.playerPosition}</span>
                <span className="text-sm font-medium text-white truncate">{p.playerName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Full draft recap */}
        <div className="card p-5">
          <h3 className="text-white font-semibold mb-3">Full Draft Recap</h3>
          <div className="space-y-0.5 max-h-80 overflow-y-auto">
            {picks.map(p => (
              <div key={p.pickNumber}
                className={`flex items-center gap-2 py-1.5 px-2 rounded text-sm ${p.isUserPick ? 'bg-brand/10' : ''}`}>
                <span className="text-slate-600 font-mono text-xs w-6 text-right">{p.pickNumber}</span>
                <span className={`text-xs font-bold ${SPORT_COLORS[p.playerSport]}`}>{p.playerSport}</span>
                <span className="badge text-xs">{p.playerPosition}</span>
                <span className={`flex-1 truncate ${p.isUserPick ? 'text-brand-light font-semibold' : 'text-white'}`}>
                  {p.playerName}
                </span>
                <span className="text-slate-600 text-xs shrink-0">
                  {p.isUserPick ? 'You' : `Slot ${p.teamSlot}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── DRAFTING ──────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Status bar */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <span className="section-label">Round {round}/{rounds}</span>
            <span className="text-slate-600 mx-2">·</span>
            <span className="section-label">Pick {pickInRound}/{numTeams}</span>
            <span className="text-slate-600 mx-2">·</span>
            <span className="section-label">Overall #{currentPick}/{totalPicks}</span>
          </div>
          {isMyTurn && (
            <span className="badge bg-brand/20 text-brand-light border border-brand/30 animate-pulse">
              Your Pick!
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {pickClock > 0 ? (
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8">
                <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <circle cx="16" cy="16" r="13" fill="none"
                    stroke={timerColor} strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 13}`}
                    strokeDashoffset={`${2 * Math.PI * 13 * (1 - timerPct / 100)}`}
                    className="transition-all duration-1000" />
                </svg>
              </div>
              <span className="font-mono text-sm font-bold" style={{ color: timerColor }}>
                {pickClock >= 60
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
        <span className="text-slate-400 text-sm">On the clock:</span>
        {isMyTurn ? (
          <span className="font-semibold text-sm text-brand-light">You (Pick #{userSlot})</span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-slate-300">
            <Bot size={13} className="text-slate-500" /> CPU — Slot {currentSlot}
            <span className="text-slate-600 text-xs animate-pulse ml-1">picking…</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Players */}
        <div className="lg:col-span-2 card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">
              Available <span className="text-slate-500 font-normal text-sm">({available.length})</span>
            </h3>
            <div className="flex items-center gap-1 rounded-lg bg-surface-3 p-0.5">
              <button onClick={() => setSortMode('adp')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  sortMode === 'adp' ? 'bg-brand/20 text-brand-light' : 'text-slate-500 hover:text-white'
                }`}>
                <ArrowUpDown size={11} /> ADP
              </button>
              <button onClick={() => setSortMode('alpha')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  sortMode === 'alpha' ? 'bg-brand/20 text-brand-light' : 'text-slate-500 hover:text-white'
                }`}>
                <AlignLeft size={11} /> A-Z
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <input className="input flex-1 text-sm py-1.5" placeholder="Search…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setSportFilter('')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                sportFilter === '' ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-slate-500 hover:text-slate-300'
              }`}>All</button>
            {sports.map(s => (
              <button key={s} onClick={() => setSportFilter(sportFilter === s ? '' : s)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                  sportFilter === s ? SPORT_BG[s] + ' ' + SPORT_COLORS[s] : 'border-white/10 text-slate-500 hover:text-slate-300'
                }`}>{s}</button>
            ))}
          </div>

          <div className="space-y-0.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredAvailable.slice(0, 80).map((player, idx) => (
              <div key={player.id}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-surface-3 transition-colors group">
                <span className="text-slate-600 text-xs w-5 text-right shrink-0">
                  {sortMode === 'adp' && player.adp != null ? Math.round(player.adp) : idx + 1}
                </span>
                <span className={`text-xs font-bold shrink-0 w-10 ${SPORT_COLORS[player.sport]}`}>{player.sport}</span>
                <span className="badge text-xs shrink-0">{player.position}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{player.name}</p>
                  {player.team && <p className="text-xs text-slate-500 truncate">{player.team}</p>}
                </div>
                {isMyTurn && (
                  <button onClick={() => handleUserPick(player.id)} disabled={!!loadingPick}
                    className="btn-primary text-xs px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {loadingPick === player.id ? '…' : 'Draft'}
                  </button>
                )}
              </div>
            ))}
            {filteredAvailable.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">No players match</p>
            )}
          </div>
        </div>

        {/* My picks */}
        <div className="card p-4 flex flex-col">
          <h3 className="text-white font-semibold mb-3 shrink-0">
            Your Picks <span className="text-slate-500 font-normal text-sm">({myPicks.length})</span>
          </h3>
          <div className="space-y-0.5 overflow-y-auto flex-1 max-h-[500px]">
            {myPicks.length === 0 && (
              <p className="text-slate-600 text-xs text-center py-6">Your picks appear here</p>
            )}
            {myPicks.map(p => (
              <div key={p.pickNumber}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 border ${SPORT_BG[p.playerSport]}`}>
                <span className="text-slate-500 text-xs font-mono w-5">{p.pickNumber}</span>
                <span className={`text-xs font-bold ${SPORT_COLORS[p.playerSport]}`}>{p.playerSport}</span>
                <span className="text-xs text-slate-400">{p.playerPosition}</span>
                <span className="text-xs font-medium text-white truncate">{p.playerName}</span>
              </div>
            ))}
          </div>

          {/* Draft board column */}
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <p className="section-label mb-2">Recent picks</p>
            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              {[...picks].reverse().slice(0, 12).map(p => (
                <div key={p.pickNumber} className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-600 font-mono w-4 text-right">{p.pickNumber}</span>
                  <ChevronRight size={10} className="text-slate-700 shrink-0" />
                  <span className={`${SPORT_COLORS[p.playerSport]} font-bold w-8 shrink-0`}>{p.playerSport}</span>
                  <span className={`truncate ${p.isUserPick ? 'text-brand-light font-semibold' : 'text-slate-400'}`}>
                    {p.playerName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
