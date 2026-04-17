import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import LiveDraftRoom from '@/components/draft/LiveDraftRoom'
import DraftSettings from '@/components/draft/DraftSettings'

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
      .select('id, status, current_pick, draft_order, timer_seconds, pick_clock, rounds, sports_included')
      .eq('league_id', id)
      .maybeSingle(),
    supabase
      .from('teams')
      .select('id, team_name, user_id, autodraft')
      .eq('league_id', id)
      .order('team_name'),
    supabase
      .from('players')
      .select('id, name, position, sport, team, adp')
      .in('sport', ['NFL', 'MLB', 'NBA', 'NHL'])
      .order('adp', { ascending: true }),
  ])

  const { data: picks } = draft
    ? await supabase
        .from('draft_picks')
        .select('pick_number, round, player_id, team_id, players(name, position, sport), teams(team_name)')
        .eq('draft_id', draft.id)
        .order('pick_number')
    : { data: [] }

  const isCommissioner = league.commissioner_id === user.id
  const draftNotStarted = !draft || draft.status === 'pre_draft'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">{league.name} — Draft</h1>
        <p className="text-slate-400 text-sm mt-1">
          Snake draft ·{' '}
          {draft?.status === 'in_progress'
            ? <span className="text-emerald-400">● Live</span>
            : draft?.status === 'completed'
            ? <span className="text-slate-400">Complete</span>
            : <span className="text-amber-400">Not started</span>}
        </p>
      </div>

      {isCommissioner && draftNotStarted && (
        <DraftSettings leagueId={id} teamCount={teams?.length ?? 0} />
      )}

      {!draftNotStarted && (
        <LiveDraftRoom
          leagueId={id}
          currentUserId={user.id}
          initialDraft={(draft as any) ?? null}
          initialPicks={(picks ?? []) as any}
          initialTeams={(teams ?? []) as any}
          initialPlayers={(players ?? []) as any}
        />
      )}

      {!isCommissioner && draftNotStarted && (
        <div className="card p-8 text-center">
          <p className="text-slate-400">Waiting for the commissioner to start the draft…</p>
        </div>
      )}
    </div>
  )
}
