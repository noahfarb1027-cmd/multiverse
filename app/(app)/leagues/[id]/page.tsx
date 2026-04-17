import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import StatCard from '@/components/ui/StatCard'
import SportBadge from '@/components/ui/SportBadge'
import type { Sport } from '@/types/database'

export default async function LeagueOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', id)
    .single()

  if (!league) notFound()

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('league_id', id)
    .order('wins', { ascending: false })
    .order('points_for', { ascending: false })

  const myTeam = teams?.find(t => t.user_id === user!.id)
  const myRank  = myTeam ? (teams?.indexOf(myTeam) ?? -1) + 1 : null

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white">{league.name}</h1>
          </div>
          <p className="text-slate-400 text-sm capitalize">
            {league.team_count} teams · {league.status}
          </p>
        </div>
        <Link href={`/leagues/${id}/draft`} className="btn-secondary text-sm">
          View Draft Board
        </Link>
      </div>

      {myTeam && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Your Rank"      value={myRank ? `#${myRank}` : '—'} accent="text-emerald-400" />
          <StatCard label="Record"         value={`${myTeam.wins}–${myTeam.losses}`} accent="text-white" />
          <StatCard label="Points For"     value={Number(myTeam.points_for).toFixed(1)} accent="text-brand-light" />
          <StatCard label="Points Against" value={Number(myTeam.points_against).toFixed(1)} accent="text-slate-300" />
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
          <Trophy size={16} className="text-amber-400" />
          <h2 className="font-semibold text-white">Standings</h2>
        </div>

        {!teams?.length ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            No teams have joined yet. Share the invite code: <span className="text-white font-mono">{league.invite_code}</span>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {['#', 'Team', 'W-L', 'PF', 'PA'].map(h => (
                    <th key={h} className="section-label px-5 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {teams.map((t, i) => {
                  const rank  = i + 1
                  const isMe  = t.user_id === user!.id
                  return (
                    <tr
                      key={t.id}
                      className={isMe ? 'bg-brand/5 border-l-2 border-l-brand' : 'hover:bg-white/[0.02]'}
                    >
                      <td className="px-5 py-3 font-bold text-slate-400 w-8">
                        {rank <= 3
                          ? <span className={['text-amber-400','text-slate-300','text-amber-700'][rank-1]}>{rank}</span>
                          : rank}
                      </td>
                      <td className="px-5 py-3 font-medium text-white">
                        {t.team_name} {isMe && <span className="text-brand-light text-xs">(you)</span>}
                      </td>
                      <td className="px-5 py-3 text-slate-300">{t.wins}–{t.losses}</td>
                      <td className="px-5 py-3 text-slate-300">{Number(t.points_for).toFixed(1)}</td>
                      <td className="px-5 py-3 text-slate-400">{Number(t.points_against).toFixed(1)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
