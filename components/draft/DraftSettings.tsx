'use client'
import { useState } from 'react'
import { startDraft } from '@/app/actions/draft'
import { Settings, Users, Clock, RotateCcw } from 'lucide-react'

const CLOCK_OPTIONS = [
  { label: 'No Limit', value: 0 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
]

const SPORT_OPTIONS = ['NFL', 'MLB', 'NBA', 'NHL'] as const

interface Props {
  leagueId: string
  teamCount: number
}

export default function DraftSettings({ leagueId, teamCount }: Props) {
  const [rounds, setRounds]         = useState(15)
  const [pickClock, setPickClock]   = useState(90)
  const [sports, setSports]         = useState<string[]>(['NFL', 'MLB', 'NBA', 'NHL'])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  function toggleSport(sport: string) {
    setSports(prev =>
      prev.includes(sport)
        ? prev.filter(s => s !== sport)
        : [...prev, sport]
    )
  }

  async function handleStart() {
    if (sports.length === 0) { setError('Select at least one sport'); return }
    setLoading(true)
    const result = await startDraft(leagueId, { rounds, pickClock, sportsIncluded: sports })
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <div className="card p-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Settings size={20} className="text-brand" />
        <h2 className="text-lg font-bold text-white">Draft Settings</h2>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-400/10 border border-rose-400/20 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Teams */}
      <div>
        <label className="section-label flex items-center gap-1.5 mb-2">
          <Users size={13} /> Teams
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range" min={2} max={20} step={1}
            value={teamCount} disabled
            className="flex-1 accent-brand"
          />
          <span className="text-white font-bold w-6 text-center">{teamCount}</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Set by league membership</p>
      </div>

      {/* Rounds */}
      <div>
        <label className="section-label flex items-center gap-1.5 mb-2">
          <RotateCcw size={13} /> Rounds
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range" min={5} max={30} step={1}
            value={rounds}
            onChange={e => setRounds(Number(e.target.value))}
            className="flex-1 accent-brand"
          />
          <span className="text-white font-bold w-6 text-center">{rounds}</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">{rounds * teamCount} total picks</p>
      </div>

      {/* Pick clock */}
      <div>
        <label className="section-label flex items-center gap-1.5 mb-2">
          <Clock size={13} /> Pick Clock
        </label>
        <div className="flex flex-wrap gap-2">
          {CLOCK_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPickClock(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                pickClock === opt.value
                  ? 'bg-brand/20 border-brand/40 text-brand-light'
                  : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sports */}
      <div>
        <label className="section-label mb-2 block">Player Pool — Sports</label>
        <div className="flex gap-2">
          {SPORT_OPTIONS.map(sport => {
            const colors: Record<string, string> = {
              NFL: 'border-nfl/40 bg-nfl/10 text-nfl',
              MLB: 'border-mlb/40 bg-mlb/10 text-mlb',
              NBA: 'border-nba/40 bg-nba/10 text-nba',
              NHL: 'border-nhl/40 bg-nhl/10 text-nhl',
            }
            const active = sports.includes(sport)
            return (
              <button
                key={sport}
                onClick={() => toggleSport(sport)}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                  active
                    ? colors[sport]
                    : 'border-white/10 text-slate-500 hover:border-white/20'
                }`}
              >
                {sport}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {sports.length === 4 ? 'All sports included' : `${sports.join(', ')} only`}
        </p>
      </div>

      <button
        onClick={handleStart}
        disabled={loading || sports.length === 0}
        className="btn-primary w-full py-3 text-base font-semibold"
      >
        {loading ? 'Starting…' : `Start Draft · ${rounds} rounds · ${teamCount} teams`}
      </button>
    </div>
  )
}
