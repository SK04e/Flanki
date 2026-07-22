import type {
  Achievement,
  Game,
  GamePlayer,
  GlobalStats,
  MatchHistoryEntry,
  PlayerProfile,
} from './types'

// The signed-in user for this prototype session.
export const CURRENT_USER: PlayerProfile = {
  player_id: 7,
  name: 'Wiktor',
  games_played: 34,
  games_won: 21,
  games_lost: 13,
  university: 'PRZ',
  faculty: 'WEII',
  email: 'wiktor@stud.prz.edu.pl',
}

// Roster of players used across leaderboard, lobbies and profiles.
export const PLAYERS: PlayerProfile[] = [
  { player_id: 12, name: 'Kamil', games_played: 58, games_won: 41, games_lost: 17, university: 'PRZ', faculty: 'WEII', email: 'kamil@stud.prz.edu.pl' },
  { player_id: 3, name: 'Zofia', games_played: 62, games_won: 44, games_lost: 18, university: 'PRZ', faculty: 'WMiFS', email: 'zofia@stud.prz.edu.pl' },
  { player_id: 21, name: 'Bartek', games_played: 47, games_won: 30, games_lost: 17, university: 'URZ', faculty: null, email: 'bartek@ur.edu.pl' },
  CURRENT_USER,
  { player_id: 9, name: 'Ola', games_played: 40, games_won: 25, games_lost: 15, university: 'PRZ', faculty: 'WZ', email: 'ola@stud.prz.edu.pl' },
  { player_id: 15, name: 'Mateusz', games_played: 51, games_won: 29, games_lost: 22, university: 'PRZ', faculty: 'WBMiL', email: 'mateusz@stud.prz.edu.pl' },
  { player_id: 33, name: 'Natalia', games_played: 28, games_won: 19, games_lost: 9, university: 'URZ', faculty: null, email: 'natalia@ur.edu.pl' },
  { player_id: 5, name: 'Piotr', games_played: 44, games_won: 22, games_lost: 22, university: 'PRZ', faculty: 'WBIŚiA', email: 'piotr@stud.prz.edu.pl' },
  { player_id: 28, name: 'Ania', games_played: 36, games_won: 24, games_lost: 12, university: 'PRZ', faculty: 'WC', email: 'ania@stud.prz.edu.pl' },
  { player_id: 41, name: 'Krzysiek', games_played: 33, games_won: 15, games_lost: 18, university: 'Other', faculty: null, email: 'krzysiek@gmail.com' },
  { player_id: 18, name: 'Dominika', games_played: 25, games_won: 16, games_lost: 9, university: 'PRZ', faculty: 'WMT', email: 'dominika@stud.prz.edu.pl' },
  { player_id: 52, name: 'Jakub', games_played: 30, games_won: 14, games_lost: 16, university: 'URZ', faculty: null, email: 'jakub@ur.edu.pl' },
]

export const PLAYERS_BY_ID: Record<number, PlayerProfile> = PLAYERS.reduce(
  (acc, p) => {
    acc[p.player_id] = p
    return acc
  },
  {} as Record<number, PlayerProfile>,
)

/** Convert a full profile into the trimmed player object embedded in a Game. */
export function toGamePlayer(
  p: PlayerProfile,
  team: GamePlayer['team'] = null,
): GamePlayer {
  return {
    player_id: p.player_id,
    name: p.name,
    university: p.university,
    faculty: p.faculty,
    games_played: p.games_played,
    games_won: p.games_won,
    team,
  }
}

export const GLOBAL_STATS: GlobalStats = {
  total_players: 150,
  total_games_played: 45,
  games_today: 12,
}

// Waiting lobbies shown in the dashboard games browser.
export const WAITING_GAMES: Game[] = [
  {
    game_id: 1,
    code: 8492,
    status: 'WAITING',
    host_id: 12,
    host_name: 'Kamil',
    players_count: 4,
    is_locked: false,
    game_mode: 'MANUAL',
    location: 'Miasteczko PRz',
    is_location_exact: true,
    start_time: null,
    end_time: null,
    winning_team: null,
    players: [
      toGamePlayer(PLAYERS_BY_ID[12], 'A'),
      toGamePlayer(PLAYERS_BY_ID[3], 'A'),
      toGamePlayer(PLAYERS_BY_ID[9], 'B'),
      toGamePlayer(PLAYERS_BY_ID[15], 'B'),
    ],
  },
  {
    game_id: 2,
    code: 3317,
    status: 'WAITING',
    host_id: 21,
    host_name: 'Bartek',
    players_count: 6,
    is_locked: true,
    game_mode: 'SHUFFLE',
    location: 'Rzeszów',
    is_location_exact: false,
    start_time: null,
    end_time: null,
    winning_team: null,
    players: [
      toGamePlayer(PLAYERS_BY_ID[21]),
      toGamePlayer(PLAYERS_BY_ID[33]),
      toGamePlayer(PLAYERS_BY_ID[52]),
      toGamePlayer(PLAYERS_BY_ID[5]),
      toGamePlayer(PLAYERS_BY_ID[28]),
      toGamePlayer(PLAYERS_BY_ID[18]),
    ],
  },
  {
    game_id: 3,
    code: 1055,
    status: 'WAITING',
    host_id: 5,
    host_name: 'Piotr',
    players_count: 2,
    is_locked: false,
    game_mode: 'MANUAL',
    location: 'Kraków',
    is_location_exact: false,
    start_time: null,
    end_time: null,
    winning_team: null,
    players: [
      toGamePlayer(PLAYERS_BY_ID[5], 'A'),
      toGamePlayer(PLAYERS_BY_ID[41], 'B'),
    ],
  },
]

// Match history for the current user (keys mirror the API exactly).
export const MATCH_HISTORY: MatchHistoryEntry[] = [
  { 'ID gry': 44, date: '2026-07-20', 'Twoja drużyna': '1', zwyciezcy: '1', 'Status gry': 'finished' },
  { 'ID gry': 41, date: '2026-07-18', 'Twoja drużyna': '2', zwyciezcy: '1', 'Status gry': 'finished' },
  { 'ID gry': 39, date: '2026-07-15', 'Twoja drużyna': '2', zwyciezcy: '2', 'Status gry': 'finished' },
  { 'ID gry': 35, date: '2026-07-12', 'Twoja drużyna': '1', zwyciezcy: '1', 'Status gry': 'finished' },
  { 'ID gry': 31, date: '2026-07-09', 'Twoja drużyna': '1', zwyciezcy: '2', 'Status gry': 'finished' },
  { 'ID gry': 27, date: '2026-07-05', 'Twoja drużyna': '2', zwyciezcy: '2', 'Status gry': 'finished' },
]

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'town-king', title: 'Town King', description: 'Wygraj 10 gier w jednym mieście', icon: 'Crown', earned: true },
  { id: 'first-blood', title: 'First Blood', description: 'Wygraj swój pierwszy mecz', icon: 'Swords', earned: true },
  { id: 'host-hero', title: 'Host Hero', description: 'Zhostuj 25 lobby', icon: 'Rocket', earned: true },
  { id: 'streak-5', title: 'On Fire', description: '5 zwycięstw z rzędu', icon: 'Flame', earned: true },
  { id: 'veteran', title: 'Weteran', description: 'Rozegraj 100 gier', icon: 'Medal', earned: false },
  { id: 'legend', title: 'Legenda', description: 'Osiągnij 80% winrate przy 50+ grach', icon: 'Trophy', earned: false },
]

export const GAME_RULES: { icon: string; text: string }[] = [
  { icon: 'Users', text: 'Dwie drużyny (BLUE / RED) rywalizują na wyznaczonym terenie na zewnątrz.' },
  { icon: 'MapPin', text: 'Host ustala lokalizację lobby — dokładne GPS lub wybrane miasto.' },
  { icon: 'Flag', text: 'Celem jest oflankowanie i wyeliminowanie przeciwnej drużyny.' },
  { icon: 'Shield', text: 'Gracz wyeliminowany czeka poza polem gry do końca rundy.' },
  { icon: 'Timer', text: 'Runda kończy się, gdy jedna drużyna zostaje wyeliminowana.' },
  { icon: 'Trophy', text: 'Host raportuje zwycięzcę — statystyki aktualizują się automatycznie.' },
]
