import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import SportBadge from '@/components/ui/SportBadge'
import { respondToTrade, cancelTrade } from '@/app/actions/trades'
import type { Sport } from '@/types/database'

const statusIcon = {
  pending:   <Clock size={14} className="text-amber-400" />,
  accepted:  <CheckCircle size={14} className="text-emerald-400" />,
  rejected:  <XCircle size={14} className="text-rose-400" />,
  cancelled: <XCircle size={14} className="text-slate-500" />,
}
const statusLabel: Record<string, string> = {
  pending:   'text-amber-400',
  accepted:  'text-emerald-400',
  rejected:  'text-rose-400',
  cancelled: 'text-slate-500',
}

export default async function TradesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trades } = await supabase
    .from('trades')
    .select(`
      *,
      proposing_team:teams!proposing_team_id(id, team_name, user_id),
      receiving_team:teams!receiving_team_id(id, team_name, user_id),
      trade_assets(*, player:players(name, position, sport))
    `)
    .eq('league_id', leagueId)
    .order('proposed_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trades</h1>
          <p className="text-slate-400 text-sm mt-1">Propose and manage player trades</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={14} /> Propose Trade
        </button>
      </div>

      {!trades?.length ? (
        <div className="card p-12 text-center text-sm text-slate-500">No trades yet.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {trades.map(t => {
            const proposing  = t.proposing_team as any
            const receiving  = t.receiving_team as any
            const iProposed  = proposing?.user_id === user!.id
            const iReceive   = receiving?.user_id === user!.id
            const direction  = iProposed ? 'outgoing' : iReceive ? 'incoming' : 'other'
            const counterparty = iProposed ? receiving?.team_name : proposing?.team_name

            const iSend    = (t.trade_assets as any[]).filter(a => a.from_team_id === proposing?.id && iProposed || a.from_team_id === receiving?.id && iReceive)
            const iReceiveAssets = (t.trade_assets as any[]).filter(a => a.to_team_id === (iProposed ? proposing?.id : receiving?.id))

            return (
              <div key={t.id} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {statusIcon[t.status as keyof typeof statusIcon]}
                    <span className={`text-sm font-semibold capitalize ${statusLabel[t.status]}`}>
                      {t.status}
                    </span>
                    <span className="text-slate-600 text-sm">·</span>
                    <span className="text-sm text-slate-400">
                      {direction === 'incoming' ? 'from' : direction === 'outgoing' ? 'to' : ''}
                      {' '}<span className="text-white">{counterparty}</span>
                    </span>
                  </div>
                  <span className="text-xs text-slate-600">
                    {new Date(t.proposed_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="rounded-lg bg-surface-2 p-4">
                    <p className="section-label mb-3">You send</p>
                    <div className="flex flex-col gap-2">
                      {iSend.length ? iSend.map((a: any) => (
                        <div key={a.id} className="flex items-center gap-2">
                          <SportBadge sport={a.player?.sport as Sport} />
                          <span className="text-sm font-medium text-white">{a.player?.name}</span>
                          <span className="text-xs text-slate-500">{a.player?.position}</span>
                        </div>
                      )) : <span className="text-xs text-slate-500">—</span>}
                    </div>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-4">
                    <p className="section-label mb-3">You receive</p>
                    <div className="flex flex-col gap-2">
                      {iReceiveAssets.length ? iReceiveAssets.map((a: any) => (
                        <div key={a.id} className="flex items-center gap-2">
                          <SportBadge sport={a.player?.sport as Sport} />
                          <span className="text-sm font-medium text-white">{a.player?.name}</span>
                          <span className="text-xs text-slate-500">{a.player?.position}</span>
                        </div>
                      )) : <span className="text-xs text-slate-500">—</span>}
                    </div>
                  </div>
                </div>

                {t.status === 'pending' && direction === 'incoming' && (
                  <div className="flex gap-3">
                    <form action={respondToTrade.bind(null, t.id, 'accepted', leagueId)}>
                      <button type="submit" className="btn-primary text-sm flex items-center gap-2">
                        <CheckCircle size={14} /> Accept
                      </button>
                    </form>
                    <form action={respondToTrade.bind(null, t.id, 'rejected', leagueId)}>
                      <button type="submit" className="btn-secondary text-sm flex items-center gap-2 text-rose-400 border-rose-400/20 hover:bg-rose-400/5">
                        <XCircle size={14} /> Decline
                      </button>
                    </form>
                  </div>
                )}
                {t.status === 'pending' && direction === 'outgoing' && (
                  <form action={cancelTrade.bind(null, t.id, leagueId)}>
                    <button type="submit" className="btn-secondary text-sm flex items-center gap-2 text-rose-400 border-rose-400/20 hover:bg-rose-400/5">
                      <XCircle size={14} /> Cancel offer
                    </button>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
