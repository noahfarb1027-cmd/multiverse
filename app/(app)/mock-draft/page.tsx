import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MockDraftRoom from '@/components/draft/MockDraftRoom'
import Link from 'next/link'
import { History, Sparkles } from 'lucide-react'

export default async function MockDraftPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: players } = await supabase
    .from('players')
    .select('id, name, position, sport, team, adp')
    .in('sport', ['NFL', 'MLB', 'NBA', 'NHL'])
    .order('adp', { ascending: true, nullsFirst: false })

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-brand" />
            <h1 className="text-2xl font-bold text-white">Mock Draft</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Practice drafting against CPU opponents — no league required.
          </p>
        </div>
        <Link href="/mock-draft/history"
          className="flex items-center gap-2 btn-secondary text-sm px-4 py-2">
          <History size={15} /> Mock History
        </Link>
      </div>

      <MockDraftRoom allPlayers={players ?? []} />
    </div>
  )
}
