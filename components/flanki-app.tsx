"use client"

import * as React from "react"
import { Flag } from "lucide-react"
import { AuthScreen } from "@/components/screens/auth-screen"
import { DashboardScreen } from "@/components/screens/dashboard-screen"
import { LobbyScreen } from "@/components/screens/lobby-screen"
import { LeaderboardScreen } from "@/components/screens/leaderboard-screen"
import { ProfileScreen } from "@/components/screens/profile-screen"
import { MatchSummaryOverlay } from "@/components/screens/match-summary-overlay"
import { BottomNav, type Tab } from "@/components/bottom-nav"
import { LocationModal } from "@/components/modals/location-modal"
import { PinModal } from "@/components/modals/pin-modal"
import { PublicProfileModal } from "@/components/modals/public-profile-modal"
import { RulesModal } from "@/components/modals/info-modals"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { useToast } from "@/components/ui/toast"
import { CURRENT_USER_ID, initialGames, globalStats, currentProfile, getPublicProfile } from "@/lib/mock-data"
import type { Game, TeamSide } from "@/lib/types"

export function FlankiApp() {
  const toast = useToast()
  const [authed, setAuthed] = React.useState(false)
  const [tab, setTab] = React.useState<Tab>("home")

  const [games, setGames] = React.useState<Game[]>(initialGames)
  const [activeGameId, setActiveGameId] = React.useState<number | null>(null)
  const [elapsed, setElapsed] = React.useState(0)
  const [matchWinner, setMatchWinner] = React.useState<"A" | "B" | null>(null)

  // Draft state for creating a lobby
  const [draftLocation, setDraftLocation] = React.useState("")
  const [draftExact, setDraftExact] = React.useState(false)

  // Modal state
  const [locationOpen, setLocationOpen] = React.useState(false)
  const [rulesOpen, setRulesOpen] = React.useState(false)
  const [publicPlayer, setPublicPlayer] = React.useState<number | null>(null)
  const [pinGame, setPinGame] = React.useState<Game | null>(null)
  const [confirm, setConfirm] = React.useState<{
    title: string
    description?: string
    confirmLabel: string
    confirmVariant?: "destructive" | "primary" | "success"
    action: () => void
  } | null>(null)

  const activeGame = games.find((g) => g.game_id === activeGameId) ?? null
  const lobbyIsActive = activeGame?.status === "PENDING"

  // Match timer
  React.useEffect(() => {
    if (!lobbyIsActive) return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [lobbyIsActive])

  function updateGame(id: number, patch: Partial<Game> | ((g: Game) => Game)) {
    setGames((prev) =>
      prev.map((g) => {
        if (g.game_id !== id) return g
        const next = typeof patch === "function" ? patch(g) : { ...g, ...patch }
        return { ...next, players_count: next.players.length }
      }),
    )
  }

  // ---- Create / join ----
  function handleCreateGame() {
    const id = Math.max(0, ...games.map((g) => g.game_id)) + 1
    const code = Math.floor(1000 + Math.random() * 9000)
    const me = getPublicProfile(CURRENT_USER_ID)
    const newGame: Game = {
      game_id: id,
      code,
      status: "WAITING",
      host_id: CURRENT_USER_ID,
      host_name: me.name,
      players_count: 1,
      is_locked: false,
      game_mode: "MANUAL",
      location: draftLocation || "Current GPS position",
      is_location_exact: draftExact,
      start_time: null,
      end_time: null,
      winning_team: null,
      players: [
        {
          player_id: CURRENT_USER_ID,
          name: me.name,
          university: me.university,
          faculty: me.faculty,
          games_played: me.games_played,
          games_won: me.games_won,
          team: null,
        },
      ],
    }
    setGames((prev) => [newGame, ...prev])
    setActiveGameId(id)
    setDraftLocation("")
    setDraftExact(false)
    setTab("lobby")
    toast("Lobby created — share your PIN!", "success")
  }

  function requestJoin(game: Game) {
    if (game.players.some((p) => p.player_id === CURRENT_USER_ID)) {
      setActiveGameId(game.game_id)
      setTab("lobby")
      return
    }
    if (game.is_locked) {
      setPinGame(game)
    } else {
      joinGame(game.game_id)
    }
  }

  function joinGame(id: number) {
    const me = getPublicProfile(CURRENT_USER_ID)
    updateGame(id, (g) => ({
      ...g,
      players: [
        ...g.players,
        {
          player_id: CURRENT_USER_ID,
          name: me.name,
          university: me.university,
          faculty: me.faculty,
          games_played: me.games_played,
          games_won: me.games_won,
          team: null,
        },
      ],
    }))
    setActiveGameId(id)
    setPinGame(null)
    setTab("lobby")
    toast("Joined the lobby", "success")
  }

  // ---- Lobby actions ----
  function joinTeam(team: Exclude<TeamSide, null>) {
    if (!activeGame) return
    updateGame(activeGame.game_id, (g) => ({
      ...g,
      players: g.players.map((p) => (p.player_id === CURRENT_USER_ID ? { ...p, team } : p)),
    }))
  }

  function kick(playerId: number) {
    if (!activeGame) return
    updateGame(activeGame.game_id, (g) => ({
      ...g,
      players: g.players.filter((p) => p.player_id !== playerId),
    }))
    toast("Player removed", "info")
  }

  function toggleLock() {
    if (!activeGame) return
    updateGame(activeGame.game_id, (g) => ({ ...g, is_locked: !g.is_locked }))
  }

  function toggleMode() {
    if (!activeGame) return
    updateGame(activeGame.game_id, (g) => ({
      ...g,
      game_mode: g.game_mode === "MANUAL" ? "RANDOM" : "MANUAL",
    }))
  }

  function shuffle() {
    if (!activeGame) return
    updateGame(activeGame.game_id, (g) => {
      const shuffled = [...g.players].sort(() => Math.random() - 0.5)
      return {
        ...g,
        players: shuffled.map((p, i) => ({ ...p, team: i % 2 === 0 ? "A" : "B" })),
      }
    })
    toast("Teams shuffled", "success")
  }

  function startGame() {
    if (!activeGame) return
    updateGame(activeGame.game_id, (g) => ({
      ...g,
      status: "PENDING",
      start_time: new Date().toISOString(),
    }))
    setElapsed(0)
    toast("Match started — good luck!", "success")
  }

  function reportWin(team: "A" | "B") {
    if (!activeGame) return
    updateGame(activeGame.game_id, (g) => ({
      ...g,
      status: "FINISHED",
      winning_team: team,
      end_time: new Date().toISOString(),
    }))
    setMatchWinner(team)
  }

  function finishMatch() {
    setMatchWinner(null)
    setGames((prev) => prev.filter((g) => g.game_id !== activeGameId))
    setActiveGameId(null)
    setTab("home")
  }

  function leaveLobby() {
    if (!activeGame) return
    const id = activeGame.game_id
    if (activeGame.host_id === CURRENT_USER_ID) return
    updateGame(id, (g) => ({
      ...g,
      players: g.players.filter((p) => p.player_id !== CURRENT_USER_ID),
    }))
    setActiveGameId(null)
    setTab("home")
    toast("Left the lobby", "info")
  }

  function destroyLobby() {
    if (!activeGame) return
    const id = activeGame.game_id
    setGames((prev) => prev.filter((g) => g.game_id !== id))
    setActiveGameId(null)
    setTab("home")
    toast("Lobby destroyed", "info")
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast(`${label} copied`, "success")
    } catch {
      toast(`${label}: ${text}`, "info")
    }
  }

  if (!authed) {
    return <AuthScreen onAuthed={() => setAuthed(true)} />
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
          <Flag className="h-4 w-4 text-primary-foreground" />
        </span>
        <span className="text-lg font-extrabold tracking-tight">Flanki Hub</span>
      </header>

      <main className="flex-1 pb-24 pt-4">
        {tab === "home" && (
          <DashboardScreen
            stats={globalStats}
            games={games.filter((g) => g.status === "WAITING")}
            draftLocation={draftLocation}
            draftExact={draftExact}
            onLocationChange={setDraftLocation}
            onPickLocation={() => setLocationOpen(true)}
            onCreateGame={handleCreateGame}
            onRequestJoin={requestJoin}
            onOpenRules={() => setRulesOpen(true)}
          />
        )}

        {tab === "leaderboard" && <LeaderboardScreen onOpenPlayer={setPublicPlayer} />}

        {tab === "profile" && <ProfileScreen onLogout={() => setAuthed(false)} />}

        {tab === "lobby" &&
          (activeGame ? (
            <LobbyScreen
              game={activeGame}
              currentUserId={CURRENT_USER_ID}
              elapsed={elapsed}
              onToggleLock={toggleLock}
              onToggleMode={toggleMode}
              onShuffle={shuffle}
              onKick={kick}
              onJoinTeam={joinTeam}
              onStart={startGame}
              onOpenPlayer={setPublicPlayer}
              onReportWin={(team) =>
                setConfirm({
                  title: `Confirm ${team === "A" ? "BLUE" : "RED"} team win?`,
                  description: "This ends the match and updates everyone's stats.",
                  confirmLabel: "Report result",
                  confirmVariant: "success",
                  action: () => reportWin(team),
                })
              }
              onDestroy={() =>
                setConfirm({
                  title: "Destroy this lobby?",
                  description: "All players will be removed and the lobby closed.",
                  confirmLabel: "Destroy",
                  confirmVariant: "destructive",
                  action: destroyLobby,
                })
              }
              onLeave={() =>
                setConfirm({
                  title: "Leave this lobby?",
                  confirmLabel: "Leave",
                  confirmVariant: "destructive",
                  action: leaveLobby,
                })
              }
              onCopyPin={() => copyText(String(activeGame.code), "PIN")}
              onCopyLink={() => copyText(`https://flanki.app/join/${activeGame.code}`, "Invite link")}
            />
          ) : (
            <EmptyLobby onBrowse={() => setTab("home")} />
          ))}
      </main>

      <BottomNav active={tab} onChange={setTab} lobbyActive={!!activeGame} />

      {/* Modals */}
      <LocationModal
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        onSelect={(loc, exact) => {
          setDraftLocation(loc)
          setDraftExact(exact)
          setLocationOpen(false)
        }}
      />
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <PublicProfileModal playerId={publicPlayer} onClose={() => setPublicPlayer(null)} />
      {pinGame && (
        <PinModal
          open={!!pinGame}
          onClose={() => setPinGame(null)}
          lobbyId={pinGame.game_id}
          correctPin={pinGame.code}
          onSubmit={() => joinGame(pinGame.game_id)}
        />
      )}
      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.action()}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        confirmVariant={confirm?.confirmVariant}
      />

      {matchWinner && <MatchSummaryOverlay winner={matchWinner} onDone={finishMatch} />}
    </div>
  )
}

function EmptyLobby({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
      <div className="glass flex h-20 w-20 items-center justify-center rounded-3xl">
        <Flag className="h-9 w-9 text-muted-foreground" />
      </div>
      <h2 className="mt-5 text-xl font-bold">No active lobby</h2>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">
        Join a waiting lobby or host your own from the Home tab to get started.
      </p>
      <button onClick={onBrowse} className="mt-5 text-sm font-semibold text-primary hover:underline">
        Browse lobbies
      </button>
    </div>
  )
}
