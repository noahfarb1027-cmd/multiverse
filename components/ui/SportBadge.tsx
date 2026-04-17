import { cn, sportColors } from '@/lib/utils'
import type { Sport } from '@/types/database'

interface Props { sport: Sport; className?: string }

export default function SportBadge({ sport, className }: Props) {
  return (
    <span className={cn('badge', sportColors[sport], className)}>
      {sport}
    </span>
  )
}
