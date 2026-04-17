'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function respondToTrade(tradeId: string, action: 'accepted' | 'rejected', leagueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: trade } = await supabase
    .from('trades')
    .select('*, receiving_team:teams!receiving_team_id(user_id)')
    .eq('id', tradeId)
    .single()

  if (!trade) throw new Error('Trade not found')
  const receivingTeam = trade.receiving_team as any
  if (receivingTeam?.user_id !== user.id) throw new Error('Not authorized to respond to this trade')

  await supabase
    .from('trades')
    .update({ status: action, resolved_at: new Date().toISOString() })
    .eq('id', tradeId)

  if (action === 'accepted') {
    const { data: assets } = await supabase
      .from('trade_assets')
      .select('*')
      .eq('trade_id', tradeId)

    for (const asset of assets ?? []) {
      await supabase
        .from('rosters')
        .update({ team_id: asset.to_team_id })
        .eq('team_id', asset.from_team_id)
        .eq('player_id', asset.player_id)
    }
  }

  revalidatePath(`/leagues/${leagueId}/trades`)
}

export async function cancelTrade(tradeId: string, leagueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: trade } = await supabase
    .from('trades')
    .select('*, proposing_team:teams!proposing_team_id(user_id)')
    .eq('id', tradeId)
    .single()

  const proposingTeam = (trade?.proposing_team) as any
  if (proposingTeam?.user_id !== user.id) throw new Error('Not authorized')

  await supabase
    .from('trades')
    .update({ status: 'cancelled', resolved_at: new Date().toISOString() })
    .eq('id', tradeId)

  revalidatePath(`/leagues/${leagueId}/trades`)
}
