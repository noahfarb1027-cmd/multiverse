import Link from 'next/link'
import { Plus, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import SportBadge from '@/components/ui/SportBadge'
import type { Sport } from '@/types/database'

export default async function RosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: myTeam } = await supabase
    .from('teams')
    .select('id, team_name')
    .eq('league_id', leagueId)
    .eq('user_id', user!.id)
    .single()

  const { data: roster } = myTeam
    ? await supabase
        .from('rosters')
        .select('*, player:players(*)')
        .eq('team_id', myTeam.id)
        .order('slot')
    : { data: [] }

  const starters = roster?.filter(r => !r.slot.startsWith('BN')) ?? []
  const bench    = roster?.filter(r => r.slot.startsWith('BN')) ?? []
  const injured  = roster?.filter(r => (r.player as any)?.status === 'injured') ?? []

  if (!myTeam) {
    return (
      <div className="card p-12 text-center">
        <p className="text-slate-400 text-sm">You don&apos;t have a team in this league.</p>
      </div>
    )
  }

  function statusPill(status: string) {
    if (status === 'injured') return <span className="badge text-rose-400 bg-rose-400/10 border-rose-400/30">IR</span>
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{myTeam.team_name}</h1>
          <p className="text-slate-400 text-sm mt-1">{roster?.length ?? 0} players on roster</p>
        </div>
        <Link href={`/leagues/${leagueId}/waivers`} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} /> Add Player
        </Link>
      </div>

      {!roster?.length ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400 text-sm mb-4">Your roster is empty. Players will appear here after the draft.</p>
          <Link href={`/leagues/${leagueId}/draft`} className="btn-secondary text-sm">View Draft</Link>
        </div>
      ) : (
        <>
          {starters.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06]">
                <p className="font-semibold text-white text-sm">Starters</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {['Slot','Player','Team','Sport','Acquired'].map(h => (
                      <th key={h} className="section-label px-5 py-3 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {starters.map(r => {
                    const p = r.player as any
                    return (
                      <tr key={r.id} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3 font-bold text-slate-400 w-16">{r.slot}</td>
                        <td className="px-5 py-3 font-medium text-white">
                          <div className="flex items-center gap-2">
                            {p?.name} {statusPill(p?.status)}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-400">{p?.team_name}</td>
                        <td className="px-5 py-3">{p && <SportBadge sport={p.sport as Sport} />}</td>
                        <td className="px-5 py-3 text-slate-500 text-xs capitalize">{r.acquisition_type}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {bench.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.06]">
                <p className="font-semibold text-white text-sm">Bench</p>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-white/[0.03]">
                  {bench.map(r => {
                    const p = r.player as any
                    return (
                      <tr key={r.id} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3 font-bold text-slate-500 w-16">BN</td>
                        <td className="px-5 py-3 font-medium text-slate-300">
                          <div className="flex items-center gap-2">
                            {p?.name} {statusPill(p?.status)}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-400">{p?.team_name}</td>
                        <td className="px-5 py-3">{p && <SportBadge sport={p.sport as Sport} />}</td>
                        <td className="px-5 py-3 text-slate-500 text-xs capitalize">{r.acquisition_type}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {injured.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-4 text-sm">
          <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-amber-200/80">
            {injured.map((r: any) => (r.player as any)?.name).join(', ')}{' '}
            {injured.length === 1 ? 'is' : 'are'} on the injury report.
            Consider picking up replacements from the waiver wire.
          </p>
        </div>
      )}
    </div>
  )
}
