'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function claimPlayer(
  leagueId: string,
  teamId: string,
  playerId: string,
  priority: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('waivers').insert({
    league_id:    leagueId,
    team_id:      teamId,
    player_id:    playerId,
    priority,
    status:       'pending',
    submitted_at: new Date().toISOString(),
  })

  revalidatePath(`/leagues/${leagueId}/waivers`)
}

export async function cancelWaiver(waiverId: string, leagueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('waivers')
    .update({ status: 'cancelled' })
    .eq('id', waiverId)

  revalidatePath(`/leagues/${leagueId}/waivers`)
}
