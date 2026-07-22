import * as React from 'react'
import {
  Crown,
  Dices,
  DoorOpen,
  Search,
  Link2,
  Lock,
  LogOut,
  MapPin,
  Repeat,
  Rocket,
  Timer,
  Trash2,
  Trophy,
  Unlock,
  UserMinus,
  Users,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils'
import { modeLabel, STATUS_META } from '@/lib/display'
import type { Game, GamePlayer, TeamName } from '@/lib/types'

interface LobbyScreenProps {
  game: Game
  currentUserId: number
  onToggleLock: () => void
  onToggleMode: () => void
  onShuffle: () => void
  onJoinTeam: (team: TeamName) => void
  onKick: (playerId: number) => void
  onStart: () => void
  onDestroy: () => void
  onLeave: () => void
  onCopyInvite: () => void
  onFinish: (winning: TeamName) => void
}

function useLiveTimer(startTime: string | null, active: boolean) {
  const [seconds, setSeconds] = React.useState(0)

  React.useEffect(() => {
    if (!active || !startTime) return
    const start = new Date(startTime).getTime()
    const tick = () =>
      setSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [startTime, active])

  return seconds
}

function PlayerTile({
  player,
  game,
  currentUserId,
  showKick,
  onKick,
  accent,
}: {
  player: GamePlayer
  game: Game
  currentUserId: number
  showKick: boolean
  onKick: (playerId: number) => void
  accent: 'default' | 'blue' | 'red'
}) {
  const isHost = player.player_id === game.host_id
  const isYou = player.player_id === currentUserId
  const avatarVariant =
    accent === 'blue' ? 'blue' : accent === 'red' ? 'red' : 'default'

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border p-2.5 transition-colors',
        accent === 'blue' && 'border-teamA/25 bg-teamA/[0.06]',
        accent === 'red' && 'border-teamB/25 bg-teamB/[0.06]',
        accent === 'default' && 'border-white/10 bg-white/[0.03]',
      )}
    >
      <Avatar name={player.name} variant={avatarVariant} className="h-9 w-9 text-xs" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{player.name}</span>
          {isHost && <Crown className="h-3.5 w-3.5 shrink-0 text-gold" />}
        </div>
        {isYou && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-teamA">
            (Ty)
          </span>
        )}
      </div>
      {showKick && !isYou && (
        <button
          onClick={() => onKick(player.player_id)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-teamB transition-colors hover:bg-teamB/15"
          aria-label={`Wyrzuć ${player.name}`}
        >
          <UserMinus className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

function TeamColumn({
  title,
  players,
  game,
  currentUserId,
  showKick,
  onKick,
  accent,
  count,
}: {
  title: string
  players: GamePlayer[]
  game: Game
  currentUserId: number
  showKick: boolean
  onKick: (playerId: number) => void
  accent: 'default' | 'blue' | 'red'
  count: number
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-3',
        accent === 'blue' && 'border-teamA/30 bg-teamA/[0.04]',
        accent === 'red' && 'border-teamB/30 bg-teamB/[0.04]',
        accent === 'default' && 'border-white/10 bg-white/[0.02]',
      )}
    >
      <div className="mb-2.5 flex items-center justify-between px-1">
        <span
          className={cn(
            'text-xs font-black uppercase tracking-wider',
            accent === 'blue' && 'text-teamA',
            accent === 'red' && 'text-teamB',
            accent === 'default' && 'text-muted-foreground',
          )}
        >
          {title}
        </span>
        <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
          <Users className="h-3 w-3" />
          {count}
        </span>
      </div>
      <div className="space-y-2">
        {players.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-3 text-center text-xs text-muted-foreground">
            Brak graczy
          </div>
        ) : (
          players.map((p) => (
            <PlayerTile
              key={p.player_id}
              player={p}
              game={game}
              currentUserId={currentUserId}
              showKick={showKick}
              onKick={onKick}
              accent={accent}
            />
          ))
        )}
      </div>
    </div>
  )
}

export function LobbyScreen({
  game,
  currentUserId,
  onToggleLock,
  onToggleMode,
  onShuffle,
  onJoinTeam,
  onKick,
  onStart,
  onDestroy,
  onLeave,
  onCopyInvite,
  onFinish,
}: LobbyScreenProps) {
  const isHost = game.host_id === currentUserId
  const isActive = game.status === 'PENDING'
  const elapsed = useLiveTimer(game.start_time, isActive)

  const unassigned = game.players.filter((p) => p.team === null)
  const blue = game.players.filter((p) => p.team === 'A')
  const red = game.players.filter((p) => p.team === 'B')

  const balanced = Math.abs(blue.length - red.length) <= 1
  const allAssigned = game.game_mode === 'MANUAL' ? unassigned.length === 0 : true
  const canStart =
    game.players_count >= 4 && balanced && allAssigned && red.length > 0 && blue.length > 0

  const status = STATUS_META[game.status]
  const myTeam = game.players.find((p) => p.player_id === currentUserId)?.team

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-tight">
              Lobby <span className="text-teamA">#{game.game_id}</span>
            </h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="muted">
              <MapPin className="h-3 w-3" />
              {game.location}
              {game.is_location_exact && ' · GPS'}
            </Badge>
            <Badge variant={game.game_mode === 'MANUAL' ? 'blue' : 'gold'}>
              <Repeat className="h-3 w-3" />
              {modeLabel(game.game_mode)}
            </Badge>
            <Badge variant="muted">
              <Users className="h-3 w-3" />
              {game.players_count}/30
            </Badge>
            {game.is_locked && (
              <Badge variant="gold">
                <Lock className="h-3 w-3" /> Zamknięte
              </Badge>
            )}
          </div>

          {isActive && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-gold/30 bg-gold/10 py-3 text-gold shadow-glow-gold">
              <Timer className="h-6 w-6 animate-pulse-glow" />
              <span className="font-mono text-3xl font-black tabular-nums">
                {formatDuration(elapsed)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite section (waiting only) */}
      {!isActive && (
        <Card className="border-teamA/25 bg-gradient-to-b from-teamA/[0.1] to-transparent">
          <CardContent className="flex flex-col items-center p-5">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Kod dołączenia
            </span>
            <div className="my-3 flex gap-2">
              {String(game.code)
                .padStart(4, '0')
                .split('')
                .map((d, i) => (
                  <span
                    key={i}
                    className="flex h-14 w-12 items-center justify-center rounded-xl border border-teamA/40 bg-teamA/10 font-mono text-3xl font-black text-teamA shadow-glow-blue"
                  >
                    {d}
                  </span>
                ))}
            </div>
            <Button variant="outline" className="w-full" onClick={onCopyInvite}>
              <Link2 className="h-4 w-4" /> Kopiuj link zaproszenia
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Team management */}
      <div className="space-y-3">
        {!isActive && (
          <TeamColumn
            title="Nieprzypisani"
            players={unassigned}
            game={game}
            currentUserId={currentUserId}
            showKick={isHost && !isActive}
            onKick={onKick}
            accent="default"
            count={unassigned.length}
          />
        )}
        <div className="grid grid-cols-2 gap-3">
          <TeamColumn
            title="Blue Team"
            players={blue}
            game={game}
            currentUserId={currentUserId}
            showKick={isHost && !isActive}
            onKick={onKick}
            accent="blue"
            count={blue.length}
          />
          <TeamColumn
            title="Red Team"
            players={red}
            game={game}
            currentUserId={currentUserId}
            showKick={isHost && !isActive}
            onKick={onKick}
            accent="red"
            count={red.length}
          />
        </div>
      </div>

      {/* Active game: host reports result */}
      {isActive && isHost && (
        <Card className="border-gold/25">
          <CardContent className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
              <Trophy className="h-5 w-5 text-gold" /> Zgłoś wynik meczu
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="primary"
                size="xl"
                className="flex-col text-sm font-extrabold leading-tight"
                onClick={() => onFinish('A')}
              >
                BLUE TEAM
                <span className="text-xs font-semibold opacity-90">wygrał</span>
              </Button>
              <Button
                variant="danger"
                size="xl"
                className="flex-col text-sm font-extrabold leading-tight"
                onClick={() => onFinish('B')}
              >
                RED TEAM
                <span className="text-xs font-semibold opacity-90">wygrał</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isActive && !isHost && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
            <Timer className="h-5 w-5 shrink-0 text-gold" />
            Mecz w toku. Host zgłosi wynik po zakończeniu rozgrywki.
          </CardContent>
        </Card>
      )}

      {/* Host controls (waiting) */}
      {!isActive && isHost && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Panel hosta
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={onToggleLock}>
                {game.is_locked ? (
                  <>
                    <Unlock className="h-4 w-4" /> Odblokuj
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Zablokuj
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onToggleMode}>
                <Repeat className="h-4 w-4" /> Tryb: {modeLabel(game.game_mode)}
              </Button>
            </div>
            {game.game_mode === 'SHUFFLE' && (
              <Button variant="gold" className="w-full" onClick={onShuffle}>
                <Dices className="h-4 w-4" /> Losuj drużyny
              </Button>
            )}

            <Button
              variant="success"
              size="xl"
              className="w-full text-base font-extrabold"
              onClick={onStart}
              disabled={!canStart}
            >
              <Rocket className="h-6 w-6" /> Rozpocznij grę
            </Button>
            {!canStart && (
              <p className="text-center text-xs text-muted-foreground">
                Potrzeba min. 4 graczy w zbalansowanych drużynach
                {game.game_mode === 'MANUAL' && ' (wszyscy przypisani)'}.
              </p>
            )}
            <Button variant="subtleDanger" className="w-full" onClick={onDestroy}>
              <Trash2 className="h-4 w-4" /> Zniszcz lobby
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Player controls (waiting) */}
      {!isActive && !isHost && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Twoje sterowanie
            </span>
            {game.game_mode === 'MANUAL' ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={myTeam === 'A' ? 'primary' : 'outline'}
                  onClick={() => onJoinTeam('A')}
                >
                  Dołącz BLUE
                </Button>
                <Button
                  variant={myTeam === 'B' ? 'danger' : 'outline'}
                  onClick={() => onJoinTeam('B')}
                >
                  Dołącz RED
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-gold/25 bg-gold/10 p-3 text-sm text-gold">
                <Dices className="h-5 w-5 shrink-0" />
                Tryb losowy — host rozlosuje drużyny przed startem.
              </div>
            )}
            <Button variant="subtleDanger" className="w-full" onClick={onLeave}>
              <LogOut className="h-4 w-4" /> Opuść lobby
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Empty-state shown on the Lobby tab when the user is not in any lobby.
export function LobbyEmptyState({ onGoSearch }: { onGoSearch: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/[0.04] ring-1 ring-white/10">
        <DoorOpen className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-bold">Nie jesteś w żadnym lobby</h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Dołącz do oczekującej gry lub stwórz własne lobby jako host.
      </p>
      <Button variant="primary" className="mt-5" onClick={onGoSearch}>
        <Search className="h-4 w-4" /> Przejdź do wyszukiwania
      </Button>
    </div>
  )
}
