import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { deleteMockDraft } from '@/app/actions/mockDraft'
import type { MockPick, MockSettings } from '@/app/actions/mockDraft'
import { Sparkles, Trash2, ChevronLeft, Trophy } from 'lucide-react'

const SPORT_COLORS: Record<string, string> = {
  NFL: 'text-nfl', MLB: 'text-mlb', NBA: 'text-nba', NHL: 'text-nhl',
}
const SPORT_BG: Record<string, string> = {
  NFL: 'bg-nfl/10 border-nfl/20', MLB: 'bg-mlb/10 border-mlb/20',
  NBA: 'bg-nba/10 border-nba/20', NHL: 'bg-nhl/10 border-nhl/20',
}

export default async function MockHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: drafts } = await supabase
    .from('mock_drafts')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'saved')
    .order('saved_at', { ascending: false })

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/mock-draft" className="btn-ghost p-2 rounded-lg">
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Mock History</h1>
          <p className="text-slate-400 text-sm mt-0.5">{drafts?.length ?? 0} saved drafts</p>
        </div>
        <Link href="/mock-draft" className="ml-auto btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Sparkles size={14} /> New Mock Draft
        </Link>
      </div>

      {!drafts?.length ? (
        <div className="card p-12 text-center">
          <Trophy size={32} className="mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 text-sm mb-4">No saved mock drafts yet.</p>
          <Link href="/mock-draft" className="btn-primary px-6 py-2.5">Run your first mock draft</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft: any) => {
            const settings = draft.settings as MockSettings
            const picks = draft.picks as MockPick[]
            const myPicks = picks.filter(p => p.isUserPick)

            return (
              <div key={draft.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-white">{draft.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(draft.saved_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      {' · '}{settings.numTeams} teams · {settings.rounds} rounds · Pick #{settings.userSlot}
                      {' · '}{settings.sports.join('/')}
                    </p>
                  </div>
                  <form action={async () => { 'use server'; await deleteMockDraft(draft.id) }}>
                    <button type="submit"
                      className="p-2 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </form>
                </div>

                <div>
                  <p className="section-label mb-2">Your {myPicks.length} picks</p>
                  <div className="flex flex-wrap gap-1.5">
                    {myPicks.map(p => (
                      <div key={p.pickNumber}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 border text-xs ${SPORT_BG[p.playerSport]}`}>
                        <span className="text-slate-500 font-mono">#{p.pickNumber}</span>
                        <span className={`font-bold ${SPORT_COLORS[p.playerSport]}`}>{p.playerSport}</span>
                        <span className="text-slate-400">{p.playerPosition}</span>
                        <span className="text-white font-medium">{p.playerName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
