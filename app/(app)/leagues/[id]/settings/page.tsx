import { notFound } from 'next/navigation'
import { Save, Copy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { updateLeagueSettings } from '@/app/actions/leagues'

export default async function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', leagueId)
    .single()

  if (!league) notFound()

  const isCommissioner = league.commissioner_id === user!.id

  const { data: scoring } = await supabase
    .from('scoring_settings')
    .select('*')
    .eq('league_id', leagueId)
    .order('sport')
    .order('stat_category')

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">League Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          {isCommissioner ? 'You are the commissioner.' : 'Only the commissioner can modify settings.'}
        </p>
      </div>

      <form action={updateLeagueSettings.bind(null, leagueId)} className="space-y-6">
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-white">General</h2>

          <div>
            <label className="section-label block mb-1.5">League Name</label>
            <input className="input" name="name" defaultValue={league.name} disabled={!isCommissioner} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="section-label block mb-1.5">Team Count</label>
              <input className="input" name="team_count" type="number" defaultValue={league.team_count} min={2} max={20} disabled={!isCommissioner} />
            </div>
            <div>
              <label className="section-label block mb-1.5">Draft Rounds</label>
              <input className="input" name="draft_pick_count" type="number" defaultValue={league.draft_pick_count} min={5} max={25} disabled={!isCommissioner} />
            </div>
          </div>

          <div>
            <label className="section-label block mb-1.5">Invite Code</label>
            <div className="flex gap-2">
              <input className="input font-mono" readOnly value={league.invite_code} />
              <button type="button" className="btn-secondary flex items-center gap-2 shrink-0">
                <Copy size={14} /> Copy
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Share this code so others can join your league.</p>
          </div>
        </div>

        {isCommissioner && (
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Save size={15} /> Save Changes
          </button>
        )}
      </form>

      {scoring && scoring.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h2 className="font-semibold text-white">Scoring Settings</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {scoring.map(s => (
              <div key={s.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-10 font-semibold">{s.sport}</span>
                  <span className="text-sm text-slate-300">{s.stat_category}</span>
                </div>
                <span className="text-sm font-semibold text-white tabular-nums">
                  {Number(s.points_per_unit) > 0 ? '+' : ''}{Number(s.points_per_unit).toFixed(2)} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {scoring?.length === 0 && (
        <div className="card p-6 text-center text-sm text-slate-500">
          No scoring settings configured yet.
        </div>
      )}
    </div>
  )
}
