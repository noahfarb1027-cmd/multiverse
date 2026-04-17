import Link from 'next/link'
import { Plus, Trophy, Users, TrendingUp, Clock, ArrowUpRight, Zap, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import StatCard from '@/components/ui/StatCard'
import SportBadge from '@/components/ui/SportBadge'
import type { Sport } from '@/types/database'

const statusColor: Record<string, string> = {
  active:    'text-emerald-400 bg-emerald-400/10',
  drafting:  'text-amber-400 bg-amber-400/10',
  setup:     'text-slate-400 bg-slate-400/10',
  completed: 'text-slate-500 bg-slate-500/10',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: teams } = await supabase
    .from('teams')
    .select('*, league:leagues(*)')
    .eq('user_id', user!.id)

  const { data: activity } = await supabase
    .from('transactions')
    .select('*, player:players(name, sport), team:teams(team_name, league_id)')
    .in('team_id', (teams ?? []).map(t => t.id))
    .order('created_at', { ascending: false })
    .limit(6)

  const wins     = teams?.reduce((s, t) => s + t.wins, 0) ?? 0
  const losses   = teams?.reduce((s, t) => s + t.losses, 0) ?? 0
  const winPct   = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0
  const bestRank = null // requires standings calc — shown as placeholder

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            {teams?.length ? `You're in ${teams.length} league${teams.length > 1 ? 's' : ''}` : 'No leagues yet'}
          </p>
        </div>
        <Link href="/leagues/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New League
        </Link>
      </div>

      {/* Live draft banners */}
      {teams?.filter((t: any) => t.league?.status === 'drafting').map((t: any) => (
        <Link key={t.id} href={`/leagues/${t.league.id}/draft`}
          className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-5 py-3.5 mb-4 hover:bg-emerald-500/15 transition-colors group">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{t.league.name} — Draft is Live!</p>
            <p className="text-xs text-emerald-400/70">{t.team_name} · Click to join the draft room</p>
          </div>
          <Zap size={16} className="text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
        </Link>
      ))}

      {/* Mock draft CTA */}
      <Link href="/mock-draft"
        className="flex items-center gap-3 rounded-xl bg-brand/10 border border-brand/20 px-5 py-3.5 mb-6 hover:bg-brand/15 transition-colors group">
        <Sparkles size={18} className="text-brand shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Try a Mock Draft</p>
          <p className="text-xs text-slate-400">Practice drafting all 4 sports against CPU — free, no league needed</p>
        </div>
        <ArrowUpRight size={15} className="text-slate-500 group-hover:text-brand-light transition-colors shrink-0" />
      </Link>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Leagues"   value={teams?.length ?? 0}  icon={Users}      accent="text-brand-light" />
        <StatCard label="Total Wins"      value={wins}                icon={Trophy}     accent="text-amber-400" />
        <StatCard label="Overall Win %"   value={`${winPct}%`}        icon={TrendingUp} accent="text-emerald-400" />
        <StatCard label="Total Losses"    value={losses}              icon={Clock}      accent="text-rose-400" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">My Leagues</h2>
          </div>

          {!teams?.length ? (
            <div className="card p-12 text-center">
              <p className="text-slate-400 text-sm mb-4">You haven&apos;t joined any leagues yet.</p>
              <Link href="/leagues/new" className="btn-primary">Create your first league</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {teams.map(t => {
                const league = t.league as any
                return (
                  <Link
                    key={t.id}
                    href={`/leagues/${league.id}`}
                    className="card-hover p-4 flex items-center gap-4 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-sm truncate">{league.name}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[league.status]}`}>
                          {league.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{league.team_count} teams</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{t.team_name}</p>
                      <p className="text-xs text-slate-400">{t.wins}–{t.losses}</p>
                    </div>
                    <ArrowUpRight size={14} className="text-slate-600 group-hover:text-brand-light transition-colors" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold text-white mb-4">Recent Activity</h2>
          {!activity?.length ? (
            <div className="card p-6 text-center text-sm text-slate-500">No activity yet.</div>
          ) : (
            <div className="card divide-y divide-white/[0.04]">
              {activity.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 p-4">
                  <SportBadge sport={(a.player?.sport ?? 'NFL') as Sport} className="mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white">
                      <span className="text-slate-400 capitalize">{a.type}</span>{' '}
                      {a.player?.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{a.team?.team_name}</p>
                  </div>
                  <span className="text-xs text-slate-600 shrink-0">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
