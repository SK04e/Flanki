"use client"

import * as React from "react"
import {
  Users,
  Gamepad2,
  CalendarDays,
  MapPin,
  LocateFixed,
  Plus,
  Lock,
  ChevronDown,
  Crown,
  Shuffle,
  Hand,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { teamLabel } from "@/lib/helpers"
import type { Game, GlobalStats } from "@/lib/types"

interface DashboardScreenProps {
  stats: GlobalStats
  games: Game[]
  draftLocation: string
  draftExact: boolean
  onPickLocation: () => void
  onLocationChange: (v: string) => void
  onCreateGame: () => void
  onRequestJoin: (game: Game) => void
  onOpenRules: () => void
}

export function DashboardScreen({
  stats,
  games,
  draftLocation,
  draftExact,
  onPickLocation,
  onLocationChange,
  onCreateGame,
  onRequestJoin,
  onOpenRules,
}: DashboardScreenProps) {
  const [expanded, setExpanded] = React.useState<number | null>(games[0]?.game_id ?? null)

  return (
    <div className="space-y-5 px-4 pb-4">
      {/* Stats bar */}
      <section className="grid grid-cols-3 gap-2.5">
        <StatCard icon={<Users className="h-4 w-4" />} value={stats.total_players} label="Players" tone="blue" />
        <StatCard icon={<Gamepad2 className="h-4 w-4" />} value={stats.total_games_played} label="Games" tone="gold" />
        <StatCard icon={<CalendarDays className="h-4 w-4" />} value={stats.games_today} label="Today" tone="green" />
      </section>

      {/* Create game card */}
      <section className="glass relative overflow-hidden rounded-3xl p-5">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold">Become a Host</h2>
              <p className="text-xs text-muted-foreground">Spin up a lobby and gather your squad</p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Crown className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={draftLocation}
                onChange={(e) => onLocationChange(e.target.value)}
                placeholder="Lobby location"
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="lg" className="w-full" onClick={onPickLocation}>
              <LocateFixed className={cn("h-5 w-5", draftExact && "text-success")} /> Use exact GPS
            </Button>
            <Button variant="success" size="lg" className="w-full text-base" onClick={onCreateGame}>
              <Plus className="h-5 w-5" /> Create New Game
            </Button>
          </div>
        </div>
      </section>

      {/* Games browser */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Waiting Lobbies</h2>
          <button
            onClick={onOpenRules}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <BookOpen className="h-4 w-4" /> How to play
          </button>
        </div>

        <div className="space-y-3">
          {games.map((game) => (
            <GameRow
              key={game.game_id}
              game={game}
              open={expanded === game.game_id}
              onToggle={() => setExpanded(expanded === game.game_id ? null : game.game_id)}
              onJoin={() => onRequestJoin(game)}
            />
          ))}
          {games.length === 0 && (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
              No open lobbies right now. Be the first to host!
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode
  value: number
  label: string
  tone: "blue" | "gold" | "green"
}) {
  const toneMap = {
    blue: "text-primary",
    gold: "text-gold",
    green: "text-success",
  }
  return (
    <div className="glass flex flex-col items-center rounded-2xl px-2 py-3.5">
      <span className={cn("mb-1", toneMap[tone])}>{icon}</span>
      <span className="text-xl font-extrabold tabular-nums">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  )
}

function GameRow({
  game,
  open,
  onToggle,
  onJoin,
}: {
  game: Game
  open: boolean
  onToggle: () => void
  onJoin: () => void
}) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <button onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-sm font-extrabold text-primary">
          #{game.game_id}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-bold">{game.host_name}</p>
            {game.is_locked && <Lock className="h-3.5 w-3.5 shrink-0 text-gold" />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge variant={game.game_mode === "MANUAL" ? "blue" : "gold"}>
              {game.game_mode === "MANUAL" ? "Manual" : "Random"}
            </Badge>
            <Badge variant="muted">
              <MapPin className="h-3 w-3" /> {game.location}
            </Badge>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm font-bold tabular-nums">
            {game.players_count}
            <span className="text-muted-foreground">/30</span>
          </span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="animate-slide-up border-t border-border px-4 pb-4 pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Players in lobby
          </p>
          <div className="space-y-1.5">
            {game.players.map((pl) => (
              <div key={pl.player_id} className="flex items-center gap-2.5 rounded-xl bg-secondary/50 px-2.5 py-2">
                <Avatar
                  name={pl.name}
                  variant={pl.team === "A" ? "blue" : pl.team === "B" ? "red" : "neutral"}
                  className="h-8 w-8 text-xs"
                />
                <span className="flex-1 text-sm font-medium">{pl.name}</span>
                {pl.player_id === game.host_id && <Crown className="h-3.5 w-3.5 text-gold" />}
                {game.game_mode === "MANUAL" && (
                  <span
                    className={cn(
                      "text-[10px] font-bold",
                      pl.team === "A" && "text-primary",
                      pl.team === "B" && "text-destructive",
                      !pl.team && "text-muted-foreground",
                    )}
                  >
                    {teamLabel(pl.team)}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            {game.game_mode === "RANDOM" ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Shuffle className="h-3.5 w-3.5" /> Teams shuffled by host
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Hand className="h-3.5 w-3.5" /> Pick your own team
              </span>
            )}
            <Button size="sm" className="ml-auto" onClick={onJoin}>
              {game.is_locked && <Lock className="h-3.5 w-3.5" />}
              Join Lobby
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
