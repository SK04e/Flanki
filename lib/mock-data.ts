import type {
  Game,
  GlobalStats,
  PlayerProfile,
  LeaderboardRow,
  Achievement,
  PlayerInGame,
} from "./types"

// The signed-in user for this prototype.
export const CURRENT_USER_ID = 12

export const UNIVERSITIES = [
  { value: "PRZ", label: "Politechnika Rzeszowska" },
  { value: "URZ", label: "Uniwersytet Rzeszowski" },
  { value: "Other", label: "Other" },
]

// Faculties only revealed for PRZ (and URZ shares the same schema here).
export const FACULTIES: Record<string, { value: string; label: string }[]> = {
  PRZ: [
    { value: "WEII", label: "Wydział Elektrotechniki i Informatyki" },
    { value: "WC", label: "Wydział Chemiczny" },
    { value: "WZ", label: "Wydział Zarządzania" },
    { value: "WMiFS", label: "Wydział Matematyki i Fizyki Stosowanej" },
    { value: "WBMiL", label: "Wydział Budowy Maszyn i Lotnictwa" },
    { value: "WBIŚiA", label: "Wydział Budownictwa, Inżynierii Środowiska i Architektury" },
    { value: "WMT", label: "Wydział Mechaniczno-Technologiczny" },
  ],
  URZ: [
    { value: "WEII", label: "Wydział Elektrotechniki i Informatyki" },
    { value: "WC", label: "Wydział Chemiczny" },
    { value: "WZ", label: "Wydział Zarządzania" },
  ],
}

export const UNIVERSITIES_WITH_FACULTY = ["PRZ", "URZ"]

export const POLISH_CITIES = [
  "Rzeszów",
  "Kraków",
  "Warszawa",
  "Wrocław",
  "Poznań",
  "Gdańsk",
  "Łódź",
  "Katowice",
  "Lublin",
  "Szczecin",
  "Bydgoszcz",
  "Białystok",
  "Kielce",
  "Tarnów",
  "Przemyśl",
  "Stalowa Wola",
]

export const CAMPUS_SPOTS = [
  "Miasteczko PRz",
  "Kampus URz",
  "Park Jedności",
  "Bulwary",
  "Stadion Resovia",
]

export const globalStats: GlobalStats = {
  total_players: 150,
  total_games_played: 45,
  games_today: 12,
}

// ---- Player roster used across lobbies ----
const roster: Record<number, Omit<PlayerInGame, "team">> = {
  12: { player_id: 12, name: "Kamil", university: "PRZ", faculty: "WEII", games_played: 10, games_won: 6 },
  7: { player_id: 7, name: "Ola", university: "PRZ", faculty: "WZ", games_played: 22, games_won: 15 },
  9: { player_id: 9, name: "Bartek", university: "URZ", faculty: "WC", games_played: 8, games_won: 3 },
  15: { player_id: 15, name: "Zosia", university: "PRZ", faculty: "WMiFS", games_played: 31, games_won: 24 },
  21: { player_id: 21, name: "Mateusz", university: "PRZ", faculty: "WBMiL", games_played: 5, games_won: 1 },
  4: { player_id: 4, name: "Julia", university: "URZ", faculty: "WZ", games_played: 18, games_won: 11 },
  33: { player_id: 33, name: "Piotr", university: "PRZ", faculty: "WMT", games_played: 14, games_won: 9 },
  40: { player_id: 40, name: "Ewa", university: "Other", faculty: null, games_played: 3, games_won: 2 },
}

function p(id: number, team: PlayerInGame["team"]): PlayerInGame {
  return { ...roster[id], team }
}

// ---- Lobbies waiting in the browser ----
export const initialGames: Game[] = [
  {
    game_id: 1,
    code: 8492,
    status: "WAITING",
    host_id: 12,
    host_name: "Kamil",
    players_count: 4,
    is_locked: false,
    game_mode: "MANUAL",
    location: "Miasteczko PRz",
    is_location_exact: true,
    start_time: null,
    end_time: null,
    winning_team: null,
    players: [p(12, "A"), p(7, "A"), p(9, "B"), p(15, null)],
  },
  {
    game_id: 2,
    code: 3120,
    status: "WAITING",
    host_id: 15,
    host_name: "Zosia",
    players_count: 6,
    is_locked: true,
    game_mode: "RANDOM",
    location: "Kampus URz",
    is_location_exact: false,
    start_time: null,
    end_time: null,
    winning_team: null,
    players: [p(15, null), p(21, null), p(4, null), p(33, null), p(40, null), p(9, null)],
  },
  {
    game_id: 3,
    code: 7765,
    status: "WAITING",
    host_id: 7,
    host_name: "Ola",
    players_count: 2,
    is_locked: false,
    game_mode: "MANUAL",
    location: "Park Jedności",
    is_location_exact: true,
    start_time: null,
    end_time: null,
    winning_team: null,
    players: [p(7, "A"), p(33, "B")],
  },
]

// ---- Leaderboard ----
export const leaderboard: LeaderboardRow[] = [
  { player_id: 15, name: "Zosia", university: "PRZ", faculty: "WMiFS", games_played: 31, games_won: 24 },
  { player_id: 7, name: "Ola", university: "PRZ", faculty: "WZ", games_played: 22, games_won: 15 },
  { player_id: 4, name: "Julia", university: "URZ", faculty: "WZ", games_played: 18, games_won: 11 },
  { player_id: 33, name: "Piotr", university: "PRZ", faculty: "WMT", games_played: 14, games_won: 9 },
  { player_id: 12, name: "Kamil", university: "PRZ", faculty: "WEII", games_played: 10, games_won: 6 },
  { player_id: 9, name: "Bartek", university: "URZ", faculty: "WC", games_played: 8, games_won: 3 },
  { player_id: 21, name: "Mateusz", university: "PRZ", faculty: "WBMiL", games_played: 5, games_won: 1 },
  { player_id: 40, name: "Ewa", university: "Other", faculty: null, games_played: 3, games_won: 2 },
]

// ---- Current user profile ----
export const currentProfile: PlayerProfile = {
  player_id: 12,
  name: "Kamil",
  email: "kamil@prz.edu.pl",
  university: "PRZ",
  faculty: "WEII",
  games_played: 10,
  games_won: 6,
  games_lost: 4,
  matchHistory: [
    { "ID gry": 41, date: "2026-07-20", "Twoja drużyna": "A", zwyciezcy: "A", "Status gry": "FINISHED" },
    { "ID gry": 38, date: "2026-07-18", "Twoja drużyna": "B", zwyciezcy: "A", "Status gry": "FINISHED" },
    { "ID gry": 35, date: "2026-07-15", "Twoja drużyna": "A", zwyciezcy: "A", "Status gry": "FINISHED" },
    { "ID gry": 31, date: "2026-07-12", "Twoja drużyna": "B", zwyciezcy: "B", "Status gry": "FINISHED" },
    { "ID gry": 28, date: "2026-07-09", "Twoja drużyna": "A", zwyciezcy: "B", "Status gry": "FINISHED" },
    { "ID gry": 24, date: "2026-07-05", "Twoja drużyna": "B", zwyciezcy: "B", "Status gry": "FINISHED" },
  ],
}

// Public profiles keyed by player id (built from roster + leaderboard).
export function getPublicProfile(playerId: number): PlayerProfile {
  const base = roster[playerId] ?? currentProfile
  const won = base.games_won
  const played = base.games_played
  return {
    player_id: base.player_id,
    name: base.name,
    email: `${base.name.toLowerCase()}@student.edu.pl`,
    university: base.university,
    faculty: base.faculty ?? null,
    games_played: played,
    games_won: won,
    games_lost: Math.max(0, played - won),
    matchHistory: currentProfile.matchHistory.slice(0, 4),
  }
}

export const achievements: Achievement[] = [
  { id: "town_king", title: "Town King", description: "Won 5 games in a single city", icon: "crown", earned: true },
  { id: "first_blood", title: "First Blood", description: "Won your very first match", icon: "swords", earned: true },
  { id: "host_hero", title: "Host Hero", description: "Hosted 10 lobbies", icon: "shield", earned: true },
  { id: "night_owl", title: "Night Owl", description: "Played a game after midnight", icon: "moon", earned: false },
  { id: "unstoppable", title: "Unstoppable", description: "Win 10 games in a row", icon: "flame", earned: false },
  { id: "veteran", title: "Veteran", description: "Play 50 total matches", icon: "medal", earned: false },
]

export const RULES = [
  { icon: "users", text: "Two teams (BLUE & RED) compete to capture the opposing team's flag and bring it back to base." },
  { icon: "flag", text: "Each team defends its own flag zone. Cross into enemy territory to grab their flag." },
  { icon: "hand", text: "Getting tagged in enemy territory sends you back to your base to respawn." },
  { icon: "timer", text: "A match runs until one team captures the flag or the host ends the round." },
  { icon: "trophy", text: "The host reports the winning team. Stats update automatically for every player." },
  { icon: "shield-check", text: "Play fair, respect campus grounds, and keep it friendly." },
]
