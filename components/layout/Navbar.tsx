'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, ChevronDown, Zap, LogOut } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface Props {
  displayName: string
  avatarUrl: string | null
}

export default function Navbar({ displayName, avatarUrl }: Props) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [menu, setMenu] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initial = displayName.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand">
            <Zap size={14} fill="currentColor" />
          </span>
          <span className="text-sm tracking-tight">Multiverse</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: '/dashboard', label: 'Dashboard' },
            { href: '/leagues',   label: 'Leagues' },
            { href: '/players',   label: 'Players' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith(href)
                  ? 'bg-brand/15 text-brand-light'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button className="relative btn-ghost p-2 rounded-lg">
            <Bell size={18} />
          </button>

          <div className="relative">
            <button
              onClick={() => setMenu(m => !m)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-white/5 transition-colors"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="h-7 w-7 rounded-full bg-gradient-to-br from-brand to-purple-400 flex items-center justify-center text-xs font-bold">
                  {initial}
                </span>
              )}
              <span className="hidden text-sm font-medium text-slate-300 md:block">{displayName}</span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>

            {menu && (
              <div className="absolute right-0 top-full mt-1 w-44 card py-1 shadow-xl">
                <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-white/5"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
