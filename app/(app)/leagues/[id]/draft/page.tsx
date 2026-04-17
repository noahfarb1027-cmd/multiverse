import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import LiveDraftRoom from '@/components/draft/LiveDraftRoom'
import { startDraft } from '@/app/actions/draft'
import type { Sport } from '@/types/database'

export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: league } = await supabase
    .from('leagues')
    .select('id, name, sport, status, commissioner_id')
    .eq('id', id)
    .single()

  if (!league) notFound()

  const [{ data: draft }, { data: teams }, { data: players }] = await Promise.all([
    supabase
      .from('drafts')
      .select('id, status, current_pick, draft_order, timer_seconds')
      .eq('league_id', id)
      .maybeSingle(),
    supabase
      .from('teams')
      .select('id, team_name, user_id')
      .eq('league_id', id)
      .order('team_name'),
    supabase
      .from('players')
      .select('id, name, position, team')
      .eq('sport', league.sport)
      .order('name'),
  ])

  const { data: picks } = draft
    ? await supabase
        .from('draft_picks')
        .select('pick_number, round, player_id, team_id, players(name, position), teams(name)')
        .eq('draft_id', draft.id)
        .order('pick_number')
    : { data: [] }

  const isCommissioner = league.commissioner_id === user.id
  const draftReady = !draft || draft.status === 'pre_draft'
  const canStart = isCommissioner && draftReady

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{league.name} Draft</h1>
          <p className="text-slate-400 text-sm mt-1">{league.sport} · Snake Draft</p>
        </div>
        {canStart && (
          <form action={async () => { 'use server'; await startDraft(id) }}>
            <button type="submit" className="btn-primary px-6 py-2.5">
              Start Draft
            </button>
          </form>
        )}
      </div>

      <LiveDraftRoom
        leagueId={id}
        sport={league.sport as Sport}
        currentUserId={user.id}
        initialDraft={(draft as any) ?? null}
        initialPicks={(picks ?? []) as any}
        initialTeams={(teams ?? []) as any}
        initialPlayers={(players ?? []) as any}
      />
    </div>
  )
}
