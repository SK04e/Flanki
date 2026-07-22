"use client"

import * as React from "react"
import {
  Crown,
  X,
  Lock,
  Unlock,
  Shuffle,
  Rocket,
  Trash2,
  LogOut,
  MapPin,
  Copy,
  Link2,
  Timer,
  Trophy,
  Info,
  Settings2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { formatTimer } from "@/lib/helpers"
import type { Game, PlayerInGame, TeamSide } from "@/lib/types"

interface LobbyScreenProps {
  game: Game
  currentUserId: number
  elapsed: number
  onToggleLock: () => void
  onToggleMode: () => void
  onShuffle: () => void
  onKick: (playerId: number) => void
  onJoinTeam: (team: Exclude<TeamSide, null>) => void
  onStart: () => void
  onDestroy: () => void
  onLeave: () => void
  onReportWin: (team: "A" | "B") => void
  onCopyPin: () => void
  onCopyLink: () => void
  onOpenPlayer: (playerId: number) => void
}

export function LobbyScreen(props: LobbyScreenProps) {
  const { game, currentUserId } = props
  const isHost = game.host_id === currentUserId
  const isActive = game.status === "PENDING"

  const unassigned = game.players.filter((p) => !p.team)
  const teamA = game.players.filter((p) => p.team === "A")
  const teamB = game.players.filter((p) => p.team === "B")
  const balanced = teamA.length === teamB.length && teamA.length >= 2
  const canStart = balanced && game.players_count >= 4 && unassigned.length === 0

  return (
    <div className="space-y-4 px-4 pb-4">
      {/* Header */}
      <section className="glass rounded-3xl p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">
            Lobby <span className="text-primary text-glow-blue">#{game.game_id}</span>
          </h1>
          <div className="flex items-center gap-2">
            {isActive ? (
              <Badge variant="gold">PENDING</Badge>
            ) : (
              <Badge variant="blue">WAITING</Badge>
            )}
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <Badge variant="muted">
            <MapPin className="h-3 w-3" /> {game.location}
          </Badge>
          <Badge variant={game.game_mode === "MANUAL" ? "blue" : "gold"}>
            {game.game_mode === "MANUAL" ? "Manual" : "Random"} mode
          </Badge>
          {game.is_locked && (
            <Badge variant="gold">
              <Lock className="h-3 w-3" /> Locked
            </Badge>
          )}
          <span className="ml-auto text-sm font-bold tabular-nums text-muted-foreground">
            {game.players_count}/30
          </span>
        </div>

        {isActive && (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-success/10 py-3 ring-1 ring-success/30">
            <Timer className="h-5 w-5 animate-pulse-ring text-success" />
            <span className="text-2xl font-extrabold tabular-nums text-success">{formatTimer(props.elapsed)}</span>
          </div>
        )}
      </section>

      {/* Invite section (only while waiting) */}
      {!isActive && (
        <section className="glass glow-blue relative overflow-hidden rounded-3xl p-5 text-center">
          <div className="pointer-events-none absolute inset-x-0 -top-10 mx-auto h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Invite code</p>
            <p className="my-2 text-6xl font-black tabular-nums tracking-[0.15em] text-primary text-glow-blue">
              {game.code}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={props.onCopyPin}>
                <Copy className="h-4 w-4" /> Copy PIN
              </Button>
              <Button variant="secondary" size="sm" onClick={props.onCopyLink}>
                <Link2 className="h-4 w-4" /> Copy Invite Link
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Teams */}
      <TeamContainer
        title="Unassigned"
        tone="neutral"
        players={unassigned}
        game={game}
        currentUserId={currentUserId}
        canKick={isHost && !isActive}
        onKick={props.onKick}
        onOpenPlayer={props.onOpenPlayer}
        hideIfEmpty={isActive}
      />
      <div className="grid grid-cols-1 gap-4">
        <TeamContainer
          title="BLUE TEAM"
          tone="blue"
          players={teamA}
          game={game}
          currentUserId={currentUserId}
          canKick={isHost && !isActive}
          onKick={props.onKick}
          onOpenPlayer={props.onOpenPlayer}
        />
        <TeamContainer
          title="RED TEAM"
          tone="red"
          players={teamB}
          game={game}
          currentUserId={currentUserId}
          canKick={isHost && !isActive}
          onKick={props.onKick}
          onOpenPlayer={props.onOpenPlayer}
        />
      </div>

      {/* Controls */}
      {isActive ? (
        <ActiveControls isHost={isHost} onReportWin={props.onReportWin} onLeave={props.onLeave} />
      ) : isHost ? (
        <HostControls game={game} canStart={canStart} balanced={balanced} {...props} />
      ) : (
        <PlayerControls game={game} onJoinTeam={props.onJoinTeam} onLeave={props.onLeave} />
      )}
    </div>
  )
}

function TeamContainer({
  title,
  tone,
  players,
  game,
  currentUserId,
  canKick,
  onKick,
  onOpenPlayer,
  hideIfEmpty,
}: {
  title: string
  tone: "blue" | "red" | "neutral"
  players: PlayerInGame[]
  game: Game
  currentUserId: number
  canKick: boolean
  onKick: (id: number) => void
  onOpenPlayer: (id: number) => void
  hideIfEmpty?: boolean
}) {
  if (hideIfEmpty && players.length === 0) return null

  const ring = {
    blue: "ring-primary/40",
    red: "ring-destructive/40",
    neutral: "ring-border",
  }[tone]
  const titleColor = {
    blue: "text-primary",
    red: "text-destructive",
    neutral: "text-muted-foreground",
  }[tone]

  return (
    <section className={cn("glass rounded-2xl p-3.5 ring-1", ring)}>
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className={cn("text-sm font-extrabold uppercase tracking-wide", titleColor)}>{title}</h3>
        <span className="text-xs font-semibold text-muted-foreground">{players.length}</span>
      </div>
      {players.length === 0 ? (
        <p className="py-3 text-center text-xs text-muted-foreground">No players yet</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {players.map((p) => (
            <PlayerTile
              key={p.player_id}
              player={p}
              tone={tone}
              isHost={p.player_id === game.host_id}
              isYou={p.player_id === currentUserId}
              canKick={canKick && p.player_id !== currentUserId}
              onKick={() => onKick(p.player_id)}
              onOpen={() => onOpenPlayer(p.player_id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function PlayerTile({
  player,
  tone,
  isHost,
  isYou,
  canKick,
  onKick,
  onOpen,
}: {
  player: PlayerInGame
  tone: "blue" | "red" | "neutral"
  isHost: boolean
  isYou: boolean
  canKick: boolean
  onKick: () => void
  onOpen: () => void
}) {
  return (
    <div className="relative flex items-center gap-2 rounded-xl bg-secondary/60 p-2 ring-1 ring-border">
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <Avatar name={player.name} variant={tone} className="h-9 w-9 text-xs" />
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-sm font-bold">
            {player.name}
            {isHost && <Crown className="h-3 w-3 shrink-0 text-gold" />}
          </p>
          {isYou && <span className="text-[10px] font-medium text-primary">(You)</span>}
        </div>
      </button>
      {canKick && (
        <button
          onClick={onKick}
          aria-label={`Kick ${player.name}`}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground ring-2 ring-background transition-transform hover:scale-110"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

function HostControls({
  game,
  canStart,
  balanced,
  onToggleLock,
  onToggleMode,
  onShuffle,
  onStart,
  onDestroy,
}: {
  game: Game
  canStart: boolean
  balanced: boolean
} & Pick<LobbyScreenProps, "onToggleLock" | "onToggleMode" | "onShuffle" | "onStart" | "onDestroy">) {
  return (
    <section className="glass space-y-3 rounded-3xl p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Settings2 className="h-3.5 w-3.5" /> Host controls
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={onToggleLock}>
          {game.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {game.is_locked ? "Unlock" : "Lock"} Lobby
        </Button>
        <Button variant="outline" onClick={onToggleMode}>
          <Shuffle className="h-4 w-4" />
          {game.game_mode === "MANUAL" ? "Mode: Manual" : "Mode: Random"}
        </Button>
      </div>
      {game.game_mode === "RANDOM" && (
        <Button variant="gold" className="w-full" onClick={onShuffle}>
          <Shuffle className="h-4 w-4" /> Shuffle Teams
        </Button>
      )}

      {!canStart && (
        <p className="flex items-center gap-1.5 rounded-xl bg-gold/10 px-3 py-2 text-xs text-gold ring-1 ring-gold/30">
          <Info className="h-3.5 w-3.5 shrink-0" />
          {game.players_count < 4
            ? "Need at least 4 players to start."
            : !balanced
              ? "Balance both teams evenly to start."
              : "Assign every player to a team to start."}
        </p>
      )}

      <Button variant="success" size="lg" className="w-full text-base" disabled={!canStart} onClick={onStart}>
        <Rocket className="h-5 w-5" /> Start Game
      </Button>
      <Button variant="destructive" className="w-full" onClick={onDestroy}>
        <Trash2 className="h-4 w-4" /> Destroy Lobby
      </Button>
    </section>
  )
}

function PlayerControls({
  game,
  onJoinTeam,
  onLeave,
}: {
  game: Game
} & Pick<LobbyScreenProps, "onJoinTeam" | "onLeave">) {
  return (
    <section className="glass space-y-3 rounded-3xl p-4">
      {game.game_mode === "MANUAL" ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Choose your team</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="primary" size="lg" onClick={() => onJoinTeam("A")}>
              Join BLUE
            </Button>
            <Button variant="destructive" size="lg" onClick={() => onJoinTeam("B")}>
              Join RED
            </Button>
          </div>
        </>
      ) : (
        <p className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-3 text-sm text-primary ring-1 ring-primary/30">
          <Shuffle className="h-4 w-4 shrink-0" /> Random mode — the host will shuffle teams before starting.
        </p>
      )}
      <Button variant="outline" className="w-full" onClick={onLeave}>
        <LogOut className="h-4 w-4" /> Leave Lobby
      </Button>
    </section>
  )
}

function ActiveControls({
  isHost,
  onReportWin,
  onLeave,
}: {
  isHost: boolean
} & Pick<LobbyScreenProps, "onReportWin" | "onLeave">) {
  if (!isHost) {
    return (
      <section className="glass space-y-3 rounded-3xl p-4">
        <p className="flex items-center gap-2 rounded-xl bg-gold/10 px-3 py-3 text-sm text-gold ring-1 ring-gold/30">
          <Timer className="h-4 w-4 shrink-0" /> Match in progress — waiting for the host to report the result.
        </p>
        <Button variant="outline" className="w-full" onClick={onLeave}>
          <LogOut className="h-4 w-4" /> Leave Match
        </Button>
      </section>
    )
  }
  return (
    <section className="glass space-y-3 rounded-3xl p-4">
      <p className="flex items-center gap-1.5 text-sm font-extrabold">
        <Trophy className="h-4 w-4 text-gold" /> Report Match Result
      </p>
      <div className="grid grid-cols-1 gap-2.5">
        <Button variant="primary" size="lg" className="h-16 text-lg" onClick={() => onReportWin("A")}>
          BLUE TEAM Won
        </Button>
        <Button variant="destructive" size="lg" className="h-16 text-lg glow-red" onClick={() => onReportWin("B")}>
          RED TEAM Won
        </Button>
      </div>
    </section>
  )
}
