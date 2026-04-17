import Navbar from '@/components/layout/Navbar'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('users').select('display_name, avatar_url').eq('id', user.id).single()
    : { data: null }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        displayName={profile?.display_name ?? user?.email?.split('@')[0] ?? 'User'}
        avatarUrl={profile?.avatar_url ?? null}
      />
      <main className="flex-1">{children}</main>
    </div>
  )
}
