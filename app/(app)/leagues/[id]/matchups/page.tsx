import { createClient } from '@/lib/supabase/server'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function MatchupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: myTeam } = await supabase
    .from('teams')
    .select('id, team_name')
    .eq('league_id', leagueId)
    .eq('user_id', user!.id)
    .single()

  const { data: matchups } = await supabase
    .from('matchups')
    .select(`
      *,
      home_team:teams!home_team_id(id, team_name, user_id),
      away_team:teams!away_team_id(id, team_name, user_id)
    `)
    .eq('league_id', leagueId)
    .order('week', { ascending: false })

  const currentWeek = matchups?.[0]?.week ?? null
  const liveMatchup = matchups?.find(m =>
    m.status === 'in_progress' &&
    ((m.home_team as any)?.user_id === user!.id || (m.away_team as any)?.user_id === user!.id)
  )
  const myMatchups = matchups?.filter(m =>
    (m.home_team as any)?.user_id === user!.id || (m.away_team as any)?.user_id === user!.id
  ) ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Matchups</h1>
        {currentWeek && <p className="text-slate-400 text-sm mt-1">Week {currentWeek}</p>}
      </div>

      {liveMatchup && (() => {
        const home    = liveMatchup.home_team as any
        const away    = liveMatchup.away_team as any
        const iAmHome = home?.user_id === user!.id
        const myScore = iAmHome ? Number(liveMatchup.home_score) : Number(liveMatchup.away_score)
        const oppScore= iAmHome ? Number(liveMatchup.away_score) : Number(liveMatchup.home_score)
        const oppName = iAmHome ? away?.team_name : home?.team_name
        const total   = myScore + oppScore

        return (
          <div className="card p-6 bg-gradient-to-br from-brand/10 via-transparent to-transparent relative overflow-hidden">
            <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-full bg-brand/10 blur-3xl" />
            <div className="flex items-center gap-2 mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Live · Week {liveMatchup.week}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1 text-center">
                <p className="text-sm text-slate-400 mb-1">{myTeam?.team_name}</p>
                <p className="text-5xl font-extrabold text-white tabular-nums">{myScore.toFixed(1)}</p>
                <span className="mt-2 inline-block text-[10px] text-brand-light bg-brand/15 px-2 py-0.5 rounded-full">you</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-slate-600">VS</span>
                <Zap size={20} className={myScore > oppScore ? 'text-brand-light' : 'text-rose-400'} />
              </div>
              <div className="flex-1 text-center">
                <p className="text-sm text-slate-400 mb-1">{oppName}</p>
                <p className="text-5xl font-extrabold text-slate-300 tabular-nums">{oppScore.toFixed(1)}</p>
              </div>
            </div>
            {total > 0 && (
              <div className="mt-6 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-purple-400 transition-all"
                  style={{ width: `${(myScore / total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )
      })()}

      <div>
        <h2 className="font-semibold text-white mb-4">
          {myMatchups.length > 0 ? 'My Schedule' : 'All Matchups'}
        </h2>
        {!matchups?.length ? (
          <div className="card p-8 text-center text-sm text-slate-500">No matchups scheduled yet.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {(myMatchups.length > 0 ? myMatchups : matchups).map(m => {
              const home    = m.home_team as any
              const away    = m.away_team as any
              const iAmHome = home?.user_id === user!.id
              const myScore = iAmHome ? Number(m.home_score) : Number(m.away_score)
              const oppScore= iAmHome ? Number(m.away_score) : Number(m.home_score)
              const oppName = iAmHome ? away?.team_name : home?.team_name
              const win     = m.status === 'completed' && myScore > oppScore
              const loss    = m.status === 'completed' && myScore < oppScore

              return (
                <div key={m.id} className="card-hover p-4 flex items-center gap-4">
                  <span className="text-xs text-slate-500 w-14 shrink-0">Week {m.week}</span>
                  {m.status === 'completed' && (
                    <div className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold shrink-0',
                      win ? 'bg-emerald-400/15 text-emerald-400' : 'bg-rose-400/15 text-rose-400'
                    )}>
                      {win ? 'W' : 'L'}
                    </div>
                  )}
                  {m.status !== 'completed' && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold shrink-0 bg-slate-400/10 text-slate-500">
                      {m.status === 'in_progress' ? '▶' : '—'}
                    </div>
                  )}
                  <div className="flex-1 text-sm">
                    <span className="text-slate-400">vs </span>
                    <span className="text-white font-medium">{oppName ?? `${home?.team_name} vs ${away?.team_name}`}</span>
                  </div>
                  {m.status !== 'scheduled' && (
                    <div className="text-sm font-mono tabular-nums text-right">
                      <span className={win ? 'text-emerald-400' : loss ? 'text-rose-400' : 'text-white'}>
                        {myScore.toFixed(1)}
                      </span>
                      <span className="text-slate-600 mx-1">–</span>
                      <span className="text-slate-400">{oppScore.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
