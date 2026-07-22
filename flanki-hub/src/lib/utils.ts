import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Build initials from a nickname, e.g. "Kamil" -> "KA". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Win ratio as a rounded percentage. */
export function winRatio(gamesPlayed: number, gamesWon: number): number {
  if (!gamesPlayed) return 0
  return Math.round((gamesWon / gamesPlayed) * 100)
}

/** Format seconds as mm:ss for the live match timer. */
export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0')
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0')
  return `${m}:${s}`
}
