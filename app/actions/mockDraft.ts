'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface MockPick {
  pickNumber: number
  round: number
  playerId: string
  playerName: string
  playerPosition: string
  playerSport: string
  playerAdp: number | null
  teamSlot: number
  isUserPick: boolean
}

export interface MockSettings {
  numTeams: number
  userSlot: number
  rounds: number
  sports: string[]
  pickClock: number
}

export async function saveMockDraft(
  settings: MockSettings,
  picks: MockPick[],
  name?: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const myPicks = picks.filter(p => p.isUserPick)
  const autoName = name || `Mock Draft — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  const { data, error } = await supabase
    .from('mock_drafts')
    .insert({
      user_id: user.id,
      name: autoName,
      status: 'saved',
      settings,
      picks,
      saved_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/mock-draft/history')
  return { data }
}

export async function deleteMockDraft(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not logged in' }

  const { error } = await supabase
    .from('mock_drafts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/mock-draft/history')
  return { data: true }
}
