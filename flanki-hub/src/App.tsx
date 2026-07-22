import * as React from 'react'
import { BottomNav, type TabKey } from '@/components/bottom-nav'
import { AuthScreen } from '@/components/screens/auth-screen'
import { DashboardScreen } from '@/components/screens/dashboard-screen'
import {
  LobbyEmptyState,
  LobbyScreen,
} from '@/components/screens/lobby-screen'
import { LeaderboardScreen } from '@/components/screens/leaderboard-screen'
import { ProfileScreen } from '@/components/screens/profile-screen'
import { MatchSummaryOverlay } from '@/components/screens/match-summary-overlay'
import { PinModal } from '@/components/modals/pin-modal'
import { LocationModal } from '@/components/modals/location-modal'
import { PublicProfileModal } from '@/components/modals/public-profile-modal'
import { RulesModal, AchievementsModal } from '@/components/modals/info-modals'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { Toaster } from '@/components/ui/toast'
import { toast } from '@/components/ui/toast-store'
import {
  CURRENT_USER,
  GLOBAL_STATS,
  MATCH_HISTORY,
  PLAYERS,
  PLAYERS_BY_ID,
  WAITING_GAMES,
  toGamePlayer,
} from '@/lib/mock-data'
import type { Game, TeamName } from '@/lib/types'

interface ConfirmState {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  variant: 'danger' | 'primary'
  onConfirm: () => void
}

const CLOSED_CONFIRM: ConfirmState = {
  open: false,
  title: '',
  description: '',
  confirmLabel: 'Potwierdź',
  variant: 'danger',
  onConfirm: () => {},
}

// Extra players used to seed a freshly-hosted lobby so host controls are usable.
const SEED_IDS = [3, 9, 15, 21]

export default function App() {
  const [authed, setAuthed] = React.useState(false)
  const [tab, setTab] = React.useState<TabKey>('search')

  const [currentGame, setCurrentGame] = React.useState<Game | null>(null)
  const [pinGame, setPinGame] = React.useState<Game | null>(null)

  const [lobbyLocation, setLobbyLocation] = React.useState('')
  const [lobbyLocationExact, setLobbyLocationExact] = React.useState(false)

  const [locationOpen, setLocationOpen] = React.useState(false)
  const [profileId, setProfileId] = React.useState<number | null>(null)
  const [rulesOpen, setRulesOpen] = React.useState(false)
  const [achievementsOpen, setAchievementsOpen] = React.useState(false)
  const [confirm, setConfirm] = React.useState<ConfirmState>(CLOSED_CONFIRM)
  const [summaryWinner, setSummaryWinner] = React.useState<TeamName | null>(null)

  function updateGame(mutator: (game: Game) => Game) {
    setCurrentGame((prev) => (prev ? mutator(prev) : prev))
  }

  function resetToDashboard() {
    setCurrentGame(null)
    setTab('search')
  }

  // ----- Create / Join -----
  function handleCreateGame() {
    const seedPlayers = SEED_IDS.map((id) => toGamePlayer(PLAYERS_BY_ID[id]))
    const newGame: Game = {
      game_id: Math.floor(1000 + Math.random() * 9000),
      code: Math.floor(1000 + Math.random() * 9000),
      status: 'WAITING',
      host_id: CURRENT_USER.player_id,
      host_name: CURRENT_USER.name,
      players_count: seedPlayers.length + 1,
      is_locked: false,
      game_mode: 'MANUAL',
      location: lobbyLocation.trim() || 'Miasteczko PRz',
      is_location_exact: lobbyLocationExact,
      start_time: null,
      end_time: null,
      winning_team: null,
      players: [toGamePlayer(CURRENT_USER), ...seedPlayers],
    }
    setCurrentGame(newGame)
    setTab('lobby')
    toast('Lobby utworzone! Jesteś hostem.', 'success')
  }

  function handleRequestJoin(game: Game) {
    setPinGame(game)
  }

  function handlePinSubmit(pin: string) {
    if (!pinGame) return
    if (pin !== String(pinGame.code)) {
      toast('Błędny kod PIN!', 'error')
      return
    }
    const joined: Game = {
      ...pinGame,
      players: [...pinGame.players, toGamePlayer(CURRENT_USER)],
      players_count: pinGame.players_count + 1,
    }
    setCurrentGame(joined)
    setPinGame(null)
    setTab('lobby')
    toast(`Dołączono do lobby #${joined.game_id}!`, 'success')
  }

  // ----- Host controls -----
  function toggleLock() {
    updateGame((g) => ({ ...g, is_locked: !g.is_locked }))
    toast('Zmieniono blokadę lobby.', 'info')
  }

  function toggleMode() {
    updateGame((g) => ({
      ...g,
      game_mode: g.game_mode === 'MANUAL' ? 'SHUFFLE' : 'MANUAL',
      players: g.players.map((p) => ({ ...p, team: null })),
    }))
    toast('Zmieniono tryb gry — drużyny zresetowane.', 'info')
  }

  function shuffle() {
    updateGame((g) => {
      const shuffled = [...g.players].sort(() => Math.random() - 0.5)
      const half = Math.ceil(shuffled.length / 2)
      const ids = new Map<number, TeamName>()
      shuffled.forEach((p, i) => ids.set(p.player_id, i < half ? 'A' : 'B'))
      return {
        ...g,
        players: g.players.map((p) => ({
          ...p,
          team: ids.get(p.player_id) ?? null,
        })),
      }
    })
    toast('Drużyny rozlosowane!', 'success')
  }

  function joinTeam(team: TeamName) {
    updateGame((g) => ({
      ...g,
      players: g.players.map((p) =>
        p.player_id === CURRENT_USER.player_id ? { ...p, team } : p,
      ),
    }))
  }

  function kick(playerId: number) {
    const target = currentGame?.players.find((p) => p.player_id === playerId)
    updateGame((g) => ({
      ...g,
      players: g.players.filter((p) => p.player_id !== playerId),
      players_count: g.players_count - 1,
    }))
    if (target) toast(`${target.name} został wyrzucony z lobby.`, 'warning')
  }

  function start() {
    updateGame((g) => ({
      ...g,
      status: 'PENDING',
      start_time: new Date().toISOString(),
    }))
    toast('Gra wystartowała!', 'success')
  }

  function destroy() {
    setConfirm({
      open: true,
      title: 'Zniszczyć lobby?',
      description:
        'Wszyscy gracze zostaną usunięci z lobby. Tej akcji nie można cofnąć.',
      confirmLabel: 'Zniszcz lobby',
      variant: 'danger',
      onConfirm: () => {
        resetToDashboard()
        toast('Lobby zostało zniszczone.', 'info')
      },
    })
  }

  function leave() {
    setConfirm({
      open: true,
      title: 'Opuścić lobby?',
      description: 'Wrócisz do ekranu wyszukiwania gier.',
      confirmLabel: 'Opuść lobby',
      variant: 'danger',
      onConfirm: () => {
        resetToDashboard()
        toast('Opuszczono lobby.', 'info')
      },
    })
  }

  function copyInvite() {
    if (!currentGame) return
    const link = `https://flanki.app/join/${currentGame.game_id}?pin=${currentGame.code}`
    navigator.clipboard?.writeText(link).catch(() => {})
    toast('Skopiowano link zaproszenia!', 'success')
  }

  function finish(winner: TeamName) {
    updateGame((g) => ({
      ...g,
      status: 'FINISHED',
      winning_team: winner,
      end_time: new Date().toISOString(),
    }))
    setSummaryWinner(winner)
  }

  // ----- Account -----
  function deleteAccount() {
    setConfirm({
      open: true,
      title: 'Usunąć konto?',
      description:
        'Twoje konto i statystyki zostaną trwale usunięte. Tej akcji nie można cofnąć.',
      confirmLabel: 'Usuń konto',
      variant: 'danger',
      onConfirm: () => {
        logout()
        toast('Konto zostało usunięte.', 'info')
      },
    })
  }

  function logout() {
    setAuthed(false)
    setCurrentGame(null)
    setTab('search')
  }

  function useGps() {
    setLobbyLocationExact(true)
    setLobbyLocation('Twoja lokalizacja (GPS)')
    toast('Ustawiono dokładną lokalizację GPS.', 'success')
  }

  if (!authed) {
    return (
      <>
        <AuthScreen onAuthenticated={() => setAuthed(true)} />
        <Toaster />
      </>
    )
  }

  return (
    <div className="mx-auto min-h-full max-w-md px-4 pb-28 pt-5">
      {tab === 'search' && (
        <DashboardScreen
          stats={GLOBAL_STATS}
          games={WAITING_GAMES}
          location={lobbyLocation}
          isLocationExact={lobbyLocationExact}
          onLocationChange={(v) => {
            setLobbyLocation(v)
            setLobbyLocationExact(false)
          }}
          onUseGps={useGps}
          onOpenLocationPicker={() => setLocationOpen(true)}
          onCreateGame={handleCreateGame}
          onRequestJoin={handleRequestJoin}
        />
      )}

      {tab === 'lobby' &&
        (currentGame ? (
          <LobbyScreen
            game={currentGame}
            currentUserId={CURRENT_USER.player_id}
            onToggleLock={toggleLock}
            onToggleMode={toggleMode}
            onShuffle={shuffle}
            onJoinTeam={joinTeam}
            onKick={kick}
            onStart={start}
            onDestroy={destroy}
            onLeave={leave}
            onCopyInvite={copyInvite}
            onFinish={finish}
          />
        ) : (
          <LobbyEmptyState onGoSearch={() => setTab('search')} />
        ))}

      {tab === 'leaderboard' && (
        <LeaderboardScreen players={PLAYERS} onOpenProfile={setProfileId} />
      )}

      {tab === 'profile' && (
        <ProfileScreen
          profile={CURRENT_USER}
          history={MATCH_HISTORY}
          totalPlaytime="18h 42m"
          onOpenRules={() => setRulesOpen(true)}
          onOpenAchievements={() => setAchievementsOpen(true)}
          onDeleteAccount={deleteAccount}
          onLogout={logout}
        />
      )}

      <BottomNav
        active={tab}
        onChange={setTab}
        lobbyActive={!!currentGame}
      />

      {/* Modals & overlays */}
      <PinModal
        open={!!pinGame}
        game={pinGame}
        onClose={() => setPinGame(null)}
        onSubmit={handlePinSubmit}
      />
      <LocationModal
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        onSelectCity={(city) => {
          setLobbyLocation(city)
          setLobbyLocationExact(false)
        }}
        onUseGps={useGps}
      />
      <PublicProfileModal
        open={profileId !== null}
        player={profileId !== null ? PLAYERS_BY_ID[profileId] : null}
        onClose={() => setProfileId(null)}
      />
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <AchievementsModal
        open={achievementsOpen}
        onClose={() => setAchievementsOpen(false)}
      />
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmLabel={confirm.confirmLabel}
        variant={confirm.variant}
        onConfirm={confirm.onConfirm}
        onClose={() => setConfirm((c) => ({ ...c, open: false }))}
      />
      {summaryWinner && (
        <MatchSummaryOverlay
          winner={summaryWinner}
          onDone={() => {
            setSummaryWinner(null)
            resetToDashboard()
          }}
        />
      )}

      <Toaster />
    </div>
  )
}
