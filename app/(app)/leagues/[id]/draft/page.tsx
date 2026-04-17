import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SportBadge from '@/components/ui/SportBadge'
import type { Sport } from '@/types/database'

export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: draft } = await supabase
    .from('drafts')
    .select('*')
    .eq('league_id', leagueId)
    .single()

  const { data: myTeam } = await supabase
    .from('teams')
    .select('id, team_name')
    .eq('league_id', leagueId)
    .eq('user_id', user!.id)
    .single()

  const { data: picks } = draft
    ? await supabase
        .from('draft_picks')
        .select('*, player:players(name, position, sport), team:teams(team_name, user_id)')
        .eq('draft_id', draft.id)
        .order('pick_number')
    : { data: [] }

  const rounds = [...new Set((picks ?? []).map(p => p.round))]
  const myPicks = (picks ?? []).filter((p: any) => p.team?.user_id === user!.id)

  if (!draft) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-white">Draft Board</h1>
        <div className="card p-12 text-center">
          <p className="text-slate-400 text-sm">The draft hasn&apos;t been set up yet. The commissioner can start it from league settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Draft Board</h1>
          <p className="text-slate-400 text-sm mt-1 capitalize">
            Status: {draft.status} · Round {draft.round} · Pick {draft.current_pick}
          </p>
        </div>
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 border text-sm font-medium
          ${draft.status === 'in_progress'
            ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
            : draft.status === 'completed'
            ? 'bg-slate-400/10 border-slate-400/20 text-slate-400'
            : 'bg-amber-400/10 border-amber-400/20 text-amber-400'}`}>
          <span className={`h-2 w-2 rounded-full ${draft.status === 'in_progress' ? 'bg-emerald-400 animate-pulse' : 'bg-current'}`} />
          {draft.status === 'in_progress' ? 'Live' : draft.status === 'completed' ? 'Complete' : 'Pending'}
        </div>
      </div>

      {myPicks.length > 0 && (
        <div className="card p-5 bg-gradient-to-r from-brand/10 to-transparent">
          <p className="section-label mb-3">Your picks ({myPicks.length})</p>
          <div className="flex flex-wrap gap-2">
            {myPicks.map((p: any) => (
              <div key={p.id} className="flex items-center gap-2 bg-surface-2 rounded-lg px-3 py-1.5 text-sm">
                <span className="text-xs text-slate-500">#{p.pick_number}</span>
                <span className="font-medium text-white">{p.player?.name}</span>
                <span className="text-xs text-slate-500">{p.player?.position}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!picks?.length ? (
        <div className="card p-8 text-center text-sm text-slate-500">
          {draft.status === 'pending' ? 'Draft picks will appear here once the draft begins.' : 'No picks recorded.'}
        </div>
      ) : (
        rounds.map(round => (
          <div key={round} className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Round {round}</span>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-white/[0.03]">
                {(picks ?? []).filter(p => p.round === round).map((p: any) => {
                  const isMe = p.team?.user_id === user!.id
                  return (
                    <tr key={p.id} className={isMe ? 'bg-brand/5' : 'hover:bg-white/[0.02]'}>
                      <td className="px-5 py-3 text-slate-500 font-mono text-xs w-12">#{p.pick_number}</td>
                      <td className="px-5 py-3 text-xs">
                        {isMe
                          ? <span className="text-brand-light font-semibold">{myTeam?.team_name}</span>
                          : <span className="text-slate-400">{p.team?.team_name}</span>}
                      </td>
                      <td className="px-5 py-3 font-semibold text-white">{p.player?.name}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{p.player?.position}</td>
                      <td className="px-5 py-3">
                        {p.player?.sport && <SportBadge sport={p.player.sport as Sport} />}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}
