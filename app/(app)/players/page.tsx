import { createClient } from '@/lib/supabase/server'
import SportBadge from '@/components/ui/SportBadge'
import type { Sport } from '@/types/database'

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string; q?: string }>
}) {
  const { sport, q } = await searchParams
  const supabase = await createClient()

  let query = supabase.from('players').select('*').order('sport').order('name')
  if (sport && sport !== 'All') query = query.eq('sport', sport)
  if (q) query = query.ilike('name', `%${q}%`)

  const { data: players } = await query.limit(100)

  const sports: Array<Sport | 'All'> = ['All', 'MLB', 'NFL', 'NBA', 'NHL']

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Player Browser</h1>
          <p className="text-slate-400 text-sm mt-1">{players?.length ?? 0} players</p>
        </div>
        <form method="GET">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name…"
            className="input w-56 text-sm"
          />
        </form>
      </div>

      <div className="flex gap-2 mb-6">
        {sports.map(s => (
          <a
            key={s}
            href={s === 'All' ? '/players' : `/players?sport=${s}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all
              ${(sport ?? 'All') === s
                ? 'bg-brand/15 text-brand-light border-brand/30'
                : 'border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}
          >
            {s}
          </a>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Player', 'Sport', 'Team', 'Position', 'Status'].map(h => (
                <th key={h} className="section-label px-5 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {players?.map(p => (
              <tr key={p.id} className="hover:bg-white/[0.02]">
                <td className="px-5 py-3 font-semibold text-white">{p.name}</td>
                <td className="px-5 py-3"><SportBadge sport={p.sport as Sport} /></td>
                <td className="px-5 py-3 text-slate-400">{p.team_name}</td>
                <td className="px-5 py-3 text-slate-400">{p.position}</td>
                <td className="px-5 py-3">
                  <span className={`flex items-center gap-1.5 text-xs ${
                    p.status === 'active'   ? 'text-emerald-400' :
                    p.status === 'injured'  ? 'text-rose-400' : 'text-slate-500'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      p.status === 'active'   ? 'bg-emerald-400' :
                      p.status === 'injured'  ? 'bg-rose-400' : 'bg-slate-500'
                    }`} />
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
            {!players?.length && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-500 text-sm">
                  No players found.{' '}
                  {!players?.length && 'Run the seed file in your Supabase SQL editor to populate players.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
