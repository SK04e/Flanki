import type { BadgeProps } from '@/components/ui/badge'
import type { GameMode, GameStatus, TeamName } from './types'

/** UI label for a game mode (SHUFFLE is presented as "Random"). */
export function modeLabel(mode: GameMode): string {
  return mode === 'MANUAL' ? 'Manual' : 'Random'
}

export function teamLabel(team: TeamName): string {
  return team === 'A' ? 'BLUE TEAM' : 'RED TEAM'
}

export function teamShort(team: TeamName): string {
  return team === 'A' ? 'BLUE' : 'RED'
}

/** Map "Team.value" ('1' | '2') used in match history back to a team name. */
export function teamFromValue(value: '1' | '2' | null): TeamName | null {
  if (value === '1') return 'A'
  if (value === '2') return 'B'
  return null
}

export const STATUS_META: Record<
  GameStatus,
  { label: string; variant: NonNullable<BadgeProps['variant']> }
> = {
  WAITING: { label: 'WAITING', variant: 'blue' },
  PENDING: { label: 'PENDING', variant: 'gold' },
  FINISHED: { label: 'FINISHED', variant: 'green' },
  CANCELED: { label: 'CANCELED', variant: 'red' },
}
