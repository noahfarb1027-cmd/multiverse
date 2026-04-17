import Link from 'next/link'
import { Zap, Trophy, ArrowLeftRight, Calendar, Users, ChevronRight, Star } from 'lucide-react'

const sports = [
  { name: 'MLB', color: 'from-mlb/20 to-mlb/5', dot: 'bg-mlb', desc: 'Pitching, hitting, saves & more' },
  { name: 'NFL', color: 'from-nfl/20 to-nfl/5', dot: 'bg-nfl', desc: 'Touchdowns, yards, receptions' },
  { name: 'NBA', color: 'from-nba/20 to-nba/5', dot: 'bg-nba', desc: 'Points, assists, rebounds' },
  { name: 'NHL', color: 'from-nhl/20 to-nhl/5', dot: 'bg-nhl', desc: 'Goals, assists, saves & +/-' },
]

const features = [
  {
    icon: Calendar,
    title: 'Live Drafts',
    desc: 'Snake drafts with real-time picks, live player stats, and a sleek draft board.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Cross-Sport Trades',
    desc: 'Trade players within the same sport. Propose, negotiate, and accept in seconds.',
  },
  {
    icon: Users,
    title: 'Waiver Wire',
    desc: 'Priority-based waiver system with instant free-agent pickups.',
  },
  {
    icon: Trophy,
    title: 'Weekly Matchups',
    desc: 'Head-to-head scoring updated live throughout each week.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* ── Nav ──────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-surface/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6">
          <div className="flex items-center gap-2 font-bold text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand">
              <Zap size={14} fill="currentColor" />
            </span>
            <span className="text-sm tracking-tight">Multiverse</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
            <Link href="/signup" className="btn-primary text-sm py-2">Get started</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-brand/10 blur-[100px]" />

        <div className="relative mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-sm text-brand-light">
            <Star size={12} fill="currentColor" />
            MLB · NFL · NBA · NHL — one platform
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Fantasy sports,
            <br />
            <span className="bg-gradient-to-r from-brand-light via-purple-400 to-pink-400 bg-clip-text text-transparent">
              all universes.
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Run one fantasy league across every major sport. Draft, trade, and compete
            with live scoring — no juggling apps.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary flex items-center gap-2 text-base px-8 py-3">
              Create your league <ChevronRight size={16} />
            </Link>
            <Link href="/dashboard" className="btn-secondary text-base px-8 py-3">
              View demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Sports grid ──────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-screen-xl grid grid-cols-2 lg:grid-cols-4 gap-4">
          {sports.map(({ name, color, dot, desc }) => (
            <div key={name} className={`card p-5 bg-gradient-to-b ${color}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                <span className="font-bold text-white tracking-wide">{name}</span>
              </div>
              <p className="text-sm text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="px-6 pb-32">
        <div className="mx-auto max-w-screen-xl">
          <div className="text-center mb-14">
            <p className="section-label mb-3">Everything you need</p>
            <h2 className="text-3xl font-bold text-white">Built for serious managers</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 flex flex-col gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand-light">
                  <Icon size={20} />
                </span>
                <div>
                  <p className="font-semibold text-white mb-1">{title}</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-2xl card p-12 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/20 via-transparent to-transparent" />
          <h2 className="relative text-3xl font-bold text-white mb-4">Ready to play?</h2>
          <p className="relative text-slate-400 mb-8">
            Set up your league in under 2 minutes. Invite friends with a single link.
          </p>
          <Link href="/signup" className="btn-primary text-base px-10 py-3">
            Start for free
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-8 px-6 text-center text-sm text-slate-600">
        © {new Date().getFullYear()} Multiverse Fantasy · Built with Next.js & Supabase
      </footer>
    </div>
  )
}
