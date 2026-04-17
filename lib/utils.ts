import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Sport } from '@/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const sportColors: Record<Sport, string> = {
  MLB: 'text-mlb bg-mlb/10 border-mlb/30',
  NFL: 'text-nfl bg-nfl/10 border-nfl/30',
  NBA: 'text-nba bg-nba/10 border-nba/30',
  NHL: 'text-nhl bg-nhl/10 border-nhl/30',
}

export const sportDot: Record<Sport, string> = {
  MLB: 'bg-mlb',
  NFL: 'bg-nfl',
  NBA: 'bg-nba',
  NHL: 'bg-nhl',
}
