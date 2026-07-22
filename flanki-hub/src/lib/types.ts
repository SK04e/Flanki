// Types mirror the JSON returned by the Python/Flask API.
// Field names MUST match the backend exactly.

export type TeamName = 'A' | 'B'

export type GameStatus = 'WAITING' | 'PENDING' | 'FINISHED' | 'CANCELED'

// Backend stores 'MANUAL' | 'SHUFFLE'. UI labels SHUFFLE as "Random".
export type GameMode = 'MANUAL' | 'SHUFFLE'

export type UniversityChoice = 'PRZ' | 'URZ' | 'Other'

export type FacultyChoice =
  | 'WEII'
  | 'WC'
  | 'WZ'
  | 'WMiFS'
  | 'WBMiL'
  | 'WBIŚiA'
  | 'WMT'

// Player as embedded inside a Game's `players` array.
export interface GamePlayer {
  player_id: number
  name: string
  university: UniversityChoice | null
  faculty: FacultyChoice | null
  games_played: number
  games_won: number
  team: TeamName | null
}

// Full player profile (Player.to_dict on the backend).
export interface PlayerProfile {
  player_id: number
  name: string
  games_played: number
  games_won: number
  games_lost: number
  university: UniversityChoice | null
  faculty: FacultyChoice | null
  email: string
}

// Game / Lobby object from /games/<id>.
export interface Game {
  game_id: number
  code: number
  status: GameStatus
  host_id: number
  host_name: string
  players_count: number
  is_locked: boolean
  game_mode: GameMode
  location: string | null
  is_location_exact: boolean
  start_time: string | null
  end_time: string | null
  winning_team: TeamName | null
  players: GamePlayer[]
}

// Global stats object from /stats.
export interface GlobalStats {
  total_players: number
  total_games_played: number
  games_today: number
}

// Match history entry (keys mirror /players/<id>/history exactly).
export interface MatchHistoryEntry {
  'ID gry': number
  date: string
  'Twoja drużyna': '1' | '2' | null // Team.value: A='1', B='2'
  zwyciezcy: '1' | '2' | null
  'Status gry': 'waiting' | 'pending' | 'finished' | 'canceled'
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earned: boolean
}
