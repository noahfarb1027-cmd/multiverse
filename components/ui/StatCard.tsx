import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  sub?: string
  icon?: LucideIcon
  accent?: string
  className?: string
}

export default function StatCard({ label, value, sub, icon: Icon, accent = 'text-brand-light', className }: Props) {
  return (
    <div className={cn('card p-5 flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        <p className="section-label">{label}</p>
        {Icon && (
          <span className={cn('p-2 rounded-lg bg-white/5', accent)}>
            <Icon size={16} />
          </span>
        )}
      </div>
      <div>
        <p className={cn('text-2xl font-bold', accent)}>{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  )
}
