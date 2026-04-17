'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createLeague(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const name           = formData.get('name') as string
  const team_count     = Number(formData.get('team_count') ?? 10)
  const draft_pick_count = Number(formData.get('draft_pick_count') ?? 15)
  const teamName       = formData.get('team_name') as string

  const { data: league, error } = await supabase
    .from('leagues')
    .insert({
      name,
      commissioner_id: user.id,
      team_count,
      draft_pick_count,
      status: 'setup',
    })
    .select()
    .single()

  if (error || !league) throw new Error(error?.message ?? 'Failed to create league')

  await supabase.from('teams').insert({
    league_id: league.id,
    user_id:   user.id,
    team_name: teamName,
  })

  redirect(`/leagues/${league.id}`)
}

export async function joinLeague(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const inviteCode = formData.get('invite_code') as string
  const teamName   = formData.get('team_name') as string

  const { data: league } = await supabase
    .from('leagues')
    .select('id')
    .eq('invite_code', inviteCode)
    .single()

  if (!league) throw new Error('Invalid invite code')

  await supabase.from('teams').insert({
    league_id: league.id,
    user_id:   user.id,
    team_name: teamName,
  })

  redirect(`/leagues/${league.id}`)
}

export async function updateLeagueSettings(leagueId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const name           = formData.get('name') as string
  const team_count     = Number(formData.get('team_count'))
  const draft_pick_count = Number(formData.get('draft_pick_count'))

  await supabase
    .from('leagues')
    .update({ name, team_count, draft_pick_count })
    .eq('id', leagueId)
    .eq('commissioner_id', user.id)

  redirect(`/leagues/${leagueId}/settings`)
}
