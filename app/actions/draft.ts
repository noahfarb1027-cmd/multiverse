'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getPickOwner } from '@/lib/sports'

export async function startDraft(leagueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: league } = await supabase
    .from('leagues')
    .select('commissioner_id, sport')
    .eq('id', leagueId)
    .single()

  if (!league || league.commissioner_id !== user.id) return { error: 'Only the commissioner can start the draft' }

  const { data: teams } = await supabase
    .from('teams')
    .select('id')
    .eq('league_id', leagueId)
    .order('team_name')

  if (!teams || teams.length < 2) return { error: 'Need at least 2 teams to start draft' }

  const teamOrder = teams.map(t => t.id)

  const { data: draft, error } = await supabase
    .from('drafts')
    .upsert({
      league_id: leagueId,
      status: 'in_progress',
      draft_order: teamOrder,
      current_pick: 1,
      timer_seconds: 90,
    }, { onConflict: 'league_id' })
    .select()
    .single()

  if (error) return { error: error.message }

  await supabase.from('leagues').update({ status: 'drafting' }).eq('id', leagueId)

  revalidatePath(`/leagues/${leagueId}/draft`)
  return { data: draft }
}

export async function makePick(draftId: string, playerId: string, leagueId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: draft } = await supabase
    .from('drafts')
    .select('current_pick, draft_order, status')
    .eq('id', draftId)
    .single()

  if (!draft || draft.status !== 'in_progress') return { error: 'Draft is not active' }

  const teamOrder = draft.draft_order as string[]
  const currentTeamId = getPickOwner(draft.current_pick, teamOrder)

  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('id', currentTeamId)
    .eq('user_id', user.id)
    .single()

  if (!team) return { error: 'It is not your turn' }

  // Check player not already picked
  const { data: existing } = await supabase
    .from('draft_picks')
    .select('id')
    .eq('draft_id', draftId)
    .eq('player_id', playerId)
    .single()

  if (existing) return { error: 'Player already drafted' }

  const { error: pickError } = await supabase.from('draft_picks').insert({
    draft_id: draftId,
    team_id: currentTeamId,
    player_id: playerId,
    pick_number: draft.current_pick,
    round: Math.ceil(draft.current_pick / teamOrder.length),
  })

  if (pickError) return { error: pickError.message }

  // Add to roster
  await supabase.from('rosters').insert({
    team_id: currentTeamId,
    player_id: playerId,
    acquisition_type: 'draft',
  })

  const totalPicks = teamOrder.length * 15
  const nextPick = draft.current_pick + 1

  if (nextPick > totalPicks) {
    await supabase.from('drafts').update({ status: 'completed', current_pick: nextPick }).eq('id', draftId)
    await supabase.from('leagues').update({ status: 'active' }).eq('id', leagueId)
  } else {
    await supabase.from('drafts').update({ current_pick: nextPick }).eq('id', draftId)
  }

  revalidatePath(`/leagues/${leagueId}/draft`)
  return { data: { pick: draft.current_pick } }
}

export async function autoPick(draftId: string, leagueId: string) {
  const supabase = await createClient()

  const { data: draft } = await supabase
    .from('drafts')
    .select('current_pick, draft_order, status')
    .eq('id', draftId)
    .single()

  if (!draft || draft.status !== 'in_progress') return { error: 'Draft not active' }

  const teamOrder = draft.draft_order as string[]
  const currentTeamId = getPickOwner(draft.current_pick, teamOrder)

  const { data: pickedIds } = await supabase
    .from('draft_picks')
    .select('player_id')
    .eq('draft_id', draftId)

  const excludeIds = (pickedIds ?? []).map(p => p.player_id)

  const { data: league } = await supabase.from('leagues').select('sport').eq('id', leagueId).single()

  let query = supabase.from('players').select('id').eq('sport', league?.sport).limit(1)
  if (excludeIds.length > 0) query = query.not('id', 'in', `(${excludeIds.join(',')})`)

  const { data: available } = await query
  if (!available || available.length === 0) return { error: 'No players available' }

  return makePick(draftId, available[0].id, leagueId)
}
