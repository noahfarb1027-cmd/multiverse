import { Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import SportBadge from '@/components/ui/SportBadge'
import { cancelWaiver, claimPlayer } from '@/app/actions/waivers'
import type { Sport } from '@/types/database'

export default async function WaiversPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: myTeam } = await supabase
    .from('teams')
    .select('id, team_name')
    .eq('league_id', leagueId)
    .eq('user_id', user!.id)
    .single()

  const { data: myWaivers } = myTeam
    ? await supabase
        .from('waivers')
        .select('*, player:players(*)')
        .eq('team_id', myTeam.id)
        .eq('status', 'pending')
        .order('priority')
    : { data: [] }

  // Find all roster player IDs in this league
  const { data: allTeams } = await supabase
    .from('teams')
    .select('id')
    .eq('league_id', leagueId)

  const teamIds = (allTeams ?? []).map(t => t.id)

  const { data: rosteredRows } = teamIds.length
    ? await supabase.from('rosters').select('player_id').in('team_id', teamIds)
    : { data: [] }

  const rosteredIds = (rosteredRows ?? []).map(r => r.player_id)

  const availableQuery = supabase
    .from('players')
    .select('*')
    .order('name')
    .limit(50)

  const { data: available } = rosteredIds.length
    ? await availableQuery.not('id', 'in', `(${rosteredIds.join(',')})`)
    : await availableQuery

  // Find next priority for this team
  const nextPriority = ((myWaivers ?? []).length > 0
    ? Math.max(...(myWaivers ?? []).map((w: any) => w.priority)) + 1
    : 1)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Waiver Wire</h1>
          <p className="text-slate-400 text-sm mt-1">Claims process each Tuesday</p>
        </div>
      </div>

      {(myWaivers ?? []).length > 0 && (
        <div>
          <h2 className="font-semibold text-white mb-3">My Pending Claims</h2>
          <div className="flex flex-col gap-3">
            {(myWaivers ?? []).map((w: any) => (
              <div key={w.id} className="card p-4 flex items-center gap-4">
                <span className="text-slate-500 font-mono text-sm w-5">{w.priority}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm">{w.player?.name}</span>
                    <span className="text-xs text-slate-500">{w.player?.position}</span>
                    <SportBadge sport={w.player?.sport as Sport} />
                  </div>
                </div>
                <form action={cancelWaiver.bind(null, w.id, leagueId)}>
                  <button type="submit" className="p-1.5 rounded hover:bg-rose-400/10 text-slate-400 hover:text-rose-400">
                    <X size={14} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white">
            Available Players <span className="text-slate-500 font-normal text-sm">({available?.length ?? 0})</span>
          </h2>
        </div>

        {!available?.length ? (
          <div className="card p-8 text-center text-sm text-slate-500">All players are rostered.</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Player', 'Pos', 'Sport', 'Team', ''].map(h => (
                    <th key={h} className="section-label px-5 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {available.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-medium text-white">{p.name}</td>
                    <td className="px-5 py-3 text-slate-400">{p.position}</td>
                    <td className="px-5 py-3"><SportBadge sport={p.sport as Sport} /></td>
                    <td className="px-5 py-3 text-slate-400">{p.team_name}</td>
                    <td className="px-5 py-3 text-right">
                      {myTeam ? (
                        <form action={claimPlayer.bind(null, leagueId, myTeam.id, p.id, nextPriority)}>
                          <button type="submit" className="btn-primary text-xs py-1 px-3 flex items-center gap-1 ml-auto">
                            <Plus size={12} /> Claim
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-slate-600">No team</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
