import { notFound } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: league } = await supabase
    .from('leagues')
    .select('name')
    .eq('id', id)
    .single()

  if (!league) notFound()

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 flex gap-8">
      <Sidebar leagueId={id} leagueName={league.name} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
