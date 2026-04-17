import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SPORTS, formatStat, isPitcher } from '@/lib/sports'
import type { Sport } from '@/types/database'
import { User } from 'lucide-react'

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="section-label mt-1">{label}</p>
    </div>
  )
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: player }, { data: stats }] = await Promise.all([
    supabase.from('players').select('*').eq('id', id).single(),
    supabase.from('player_stats').select('*').eq('player_id', id).eq('season', 2025).maybeSingle(),
  ])

  if (!player) notFound()

  const sport = player.sport as Sport
  const config = SPORTS[sport]

  const sportColor: Record<Sport, string> = {
    NFL: 'text-nfl',
    MLB: 'text-mlb',
    NBA: 'text-nba',
    NHL: 'text-nhl',
  }

  const pitcher = sport === 'MLB' && isPitcher(player.position)
  const statCategories = pitcher
    ? (config.pitcherCategories ?? [])
    : sport === 'MLB'
    ? config.statCategories
    : config.statCategories

  // Check if rostered
  const { data: roster } = await supabase
    .from('rosters')
    .select('teams(team_name, leagues(name))')
    .eq('player_id', id)
    .maybeSingle()

  const team = (roster?.teams as any)
  const leagueName = team?.leagues?.name

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-3 shrink-0">
            <User size={32} className="text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">{player.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-sm font-semibold ${sportColor[sport]}`}>{sport}</span>
                  <span className="text-slate-500">·</span>
                  <span className="badge">{player.position}</span>
                  {player.team_name && (
                    <>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-300 text-sm">{player.team_name}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                {team ? (
                  <div>
                    <p className="text-xs text-slate-500">Rostered by</p>
                    <p className="text-sm font-medium text-white">{team.team_name}</p>
                    {leagueName && <p className="text-xs text-slate-500">{leagueName}</p>}
                  </div>
                ) : (
                  <span className="badge bg-emerald-400/10 border-emerald-400/20 text-emerald-400">Free Agent</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2025 Stats */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3">2025 Season Stats</h2>
        {stats ? (
          <>
            {stats.games && (
              <p className="text-xs text-slate-500 mb-3">{stats.games} games played</p>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {statCategories.map(cat => {
                const raw = (stats as any)[cat.key]
                if (raw == null) return null
                return (
                  <StatCard
                    key={cat.key}
                    label={cat.label}
                    value={formatStat(raw, cat.format)}
                  />
                )
              })}
            </div>

            {/* MLB: show both hitter and pitcher splits if applicable */}
            {sport === 'MLB' && !pitcher && config.pitcherCategories && (
              (() => {
                const pitcherStats = config.pitcherCategories!.filter(c => (stats as any)[c.key] != null)
                return pitcherStats.length > 0 ? (
                  <>
                    <h3 className="text-sm font-semibold text-slate-400 mt-5 mb-3">Pitching</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {pitcherStats.map(cat => (
                        <StatCard
                          key={cat.key}
                          label={cat.label}
                          value={formatStat((stats as any)[cat.key], cat.format)}
                        />
                      ))}
                    </div>
                  </>
                ) : null
              })()
            )}
          </>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-slate-500 text-sm">No stats available for the 2025 season.</p>
          </div>
        )}
      </div>

      {/* Bio / info */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-400 mb-3">Player Info</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="section-label">Sport</dt>
            <dd className={`font-medium ${sportColor[sport]}`}>{sport}</dd>
          </div>
          <div>
            <dt className="section-label">Position</dt>
            <dd className="text-white font-medium">{player.position}</dd>
          </div>
          {player.team_name && (
            <div>
              <dt className="section-label">Real Team</dt>
              <dd className="text-white font-medium">{player.team_name}</dd>
            </div>
          )}
          <div>
            <dt className="section-label">Fantasy Status</dt>
            <dd className={team ? 'text-slate-400' : 'text-emerald-400 font-medium'}>
              {team ? 'Rostered' : 'Available'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
