// Types mirror the Python/Flask API response shapes exactly.

export type GameStatus = "WAITING" | "PENDING" | "FINISHED" | "CANCELED"
export type GameMode = "MANUAL" | "RANDOM"
export type TeamSide = "A" | "B" | null // A = BLUE, B = RED

export interface PlayerInGame {
  player_id: number
  name: string
  university: string
  faculty: string | null
  games_played: number
  games_won: number
  team: TeamSide
}

export interface Game {
  game_id: number
  code: number
  status: GameStatus
  host_id: number
  host_name: string
  players_count: number
  is_locked: boolean
  game_mode: GameMode
  location: string
  is_location_exact: boolean
  start_time: string | null
  end_time: string | null
  winning_team: "A" | "B" | null
  players: PlayerInGame[]
}

export interface GlobalStats {
  total_players: number
  total_games_played: number
  games_today: number
}

// Match history rows use the exact Polish keys returned by the API.
export interface MatchHistoryRow {
  "ID gry": number
  date: string
  "Twoja drużyna": "A" | "B"
  zwyciezcy: "A" | "B"
  "Status gry": GameStatus
}

export interface PlayerProfile {
  player_id: number
  name: string
  email: string
  university: string
  faculty: string | null
  games_played: number
  games_won: number
  games_lost: number
  matchHistory: MatchHistoryRow[]
}

export interface LeaderboardRow {
  player_id: number
  name: string
  university: string
  faculty: string | null
  games_played: number
  games_won: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earned: boolean
}
