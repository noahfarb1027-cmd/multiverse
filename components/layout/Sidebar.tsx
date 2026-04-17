'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Calendar, ArrowLeftRight,
  ListChecks, Trophy, Settings, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { icon: LayoutDashboard, label: 'Overview',  href: '' },
  { icon: Users,           label: 'Roster',    href: '/roster' },
  { icon: Calendar,        label: 'Draft',     href: '/draft' },
  { icon: Trophy,          label: 'Matchups',  href: '/matchups' },
  { icon: ArrowLeftRight,  label: 'Trades',    href: '/trades' },
  { icon: ListChecks,      label: 'Waivers',   href: '/waivers' },
  { icon: Settings,        label: 'Settings',  href: '/settings' },
]

interface Props { leagueId: string; leagueName: string }

export default function Sidebar({ leagueId, leagueName }: Props) {
  const pathname = usePathname()
  const base = `/leagues/${leagueId}`

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0">
      {/* League name */}
      <div className="mb-4 px-3">
        <p className="section-label mb-1">Current league</p>
        <p className="text-sm font-semibold text-white truncate">{leagueName}</p>
      </div>

      <nav className="flex flex-col gap-0.5">
        {nav.map(({ icon: Icon, label, href }) => {
          const to = `${base}${href}`
          const active = href === ''
            ? pathname === base
            : pathname.startsWith(to)
          return (
            <Link
              key={href}
              href={to}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                active
                  ? 'bg-brand/15 text-brand-light'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={12} className="opacity-60" />}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
