import * as React from 'react'
import {
  ChevronDown,
  Crosshair,
  Crown,
  Gamepad2,
  Lock,
  MapPin,
  Plus,
  Radio,
  Rocket,
  Trophy,
  Unlock,
  Users,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { modeLabel } from '@/lib/display'
import type { Game, GlobalStats } from '@/lib/types'

interface DashboardScreenProps {
  stats: GlobalStats
  games: Game[]
  location: string
  isLocationExact: boolean
  onLocationChange: (value: string) => void
  onUseGps: () => void
  onOpenLocationPicker: () => void
  onCreateGame: () => void
  onRequestJoin: (game: Game) => void
}

function StatTile({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: number
  label: string
  accent: string
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center backdrop-blur-xl">
      <Icon className={cn('h-5 w-5', accent)} />
      <span className="text-xl font-black tabular-nums">
        {value.toLocaleString('pl-PL')}
      </span>
      <span className="text-[10px] font-medium uppercase leading-tight tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

function GameRow({
  game,
  onRequestJoin,
}: {
  game: Game
  onRequestJoin: (game: Game) => void
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/[0.03]"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teamA/15 font-bold text-teamA">
          #{game.game_id}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">{game.host_name}</span>
            {game.is_locked && (
              <Lock className="h-3.5 w-3.5 shrink-0 text-gold" />
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant="muted">
              <MapPin className="h-3 w-3" />
              {game.location}
            </Badge>
            <Badge variant={game.game_mode === 'MANUAL' ? 'blue' : 'gold'}>
              {modeLabel(game.game_mode)}
            </Badge>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="flex items-center gap-1 text-sm font-bold tabular-nums">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            {game.players_count}/30
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              open && 'rotate-180',
            )}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 bg-black/20 p-4 animate-slide-up">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Gracze w lobby
          </p>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {game.players.map((p) => (
              <div
                key={p.player_id}
                className="flex items-center gap-2 rounded-lg bg-white/[0.03] p-2"
              >
                <Avatar name={p.name} className="h-8 w-8 text-xs" />
                <span className="truncate text-sm font-medium">{p.name}</span>
                {p.player_id === game.host_id && (
                  <Crown className="ml-auto h-3.5 w-3.5 text-gold" />
                )}
              </div>
            ))}
          </div>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => onRequestJoin(game)}
            disabled={game.is_locked || game.players_count >= 30}
          >
            {game.is_locked ? (
              <>
                <Lock className="h-4 w-4" /> Lobby zablokowane
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4" /> Dołącz do lobby
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  )
}

export function DashboardScreen({
  stats,
  games,
  location,
  isLocationExact,
  onLocationChange,
  onUseGps,
  onOpenLocationPicker,
  onCreateGame,
  onRequestJoin,
}: DashboardScreenProps) {
  return (
    <div className="space-y-6">
      <header className="pt-1">
        <h1 className="text-2xl font-black tracking-tight">Znajdź grę</h1>
        <p className="text-sm text-muted-foreground">
          Dołącz do lobby lub zostań hostem
        </p>
      </header>

      {/* Global stats bar */}
      <div className="flex gap-2">
        <StatTile
          icon={Users}
          value={stats.total_players}
          label="Gracze"
          accent="text-teamA"
        />
        <StatTile
          icon={Trophy}
          value={stats.total_games_played}
          label="Rozegrane gry"
          accent="text-gold"
        />
        <StatTile
          icon={Radio}
          value={stats.games_today}
          label="Dziś"
          accent="text-success"
        />
      </div>

      {/* Create game card */}
      <Card className="border-teamA/25 bg-gradient-to-br from-teamA/[0.12] to-transparent">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teamA/20 text-teamA">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Zostań hostem</h2>
              <p className="text-xs text-muted-foreground">
                Stwórz lobby i zaproś graczy
              </p>
            </div>
          </div>

          <button
            onClick={onOpenLocationPicker}
            className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1 pl-1 text-left"
          >
            <span className="sr-only">Wybierz lokalizację z listy</span>
            <div className="relative flex-1">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={location}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onLocationChange(e.target.value)}
                placeholder="Lokalizacja lobby"
                className="border-0 bg-transparent pl-10 focus-visible:ring-0"
              />
            </div>
          </button>

          <Button
            variant={isLocationExact ? 'primary' : 'outline'}
            size="lg"
            className="w-full"
            onClick={onUseGps}
          >
            <Crosshair className="h-5 w-5" />
            {isLocationExact ? 'Używasz dokładnego GPS' : 'Użyj dokładnego GPS'}
          </Button>

          <Button
            variant="success"
            size="xl"
            className="w-full text-base font-extrabold"
            onClick={onCreateGame}
          >
            <Plus className="h-6 w-6" /> Stwórz nową grę
          </Button>
        </CardContent>
      </Card>

      {/* Games browser */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Gamepad2 className="h-5 w-5 text-teamA" /> Oczekujące lobby
          </h2>
          <Badge variant="muted">{games.length} aktywne</Badge>
        </div>

        {games.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Brak oczekujących lobby. Zostań pierwszym hostem!
          </Card>
        ) : (
          <div className="space-y-3">
            {games.map((game) => (
              <GameRow
                key={game.game_id}
                game={game}
                onRequestJoin={onRequestJoin}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
