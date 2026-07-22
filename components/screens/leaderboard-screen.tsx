"use client"

import * as React from "react"
import { Trophy, Medal } from "lucide-react"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { winRatio } from "@/lib/helpers"
import { leaderboard, UNIVERSITIES, FACULTIES, UNIVERSITIES_WITH_FACULTY } from "@/lib/mock-data"

export function LeaderboardScreen({ onOpenPlayer }: { onOpenPlayer: (id: number) => void }) {
  const [university, setUniversity] = React.useState("all")
  const [faculty, setFaculty] = React.useState("all")

  const showFaculty = UNIVERSITIES_WITH_FACULTY.includes(university)

  const filtered = React.useMemo(() => {
    return leaderboard
      .filter((r) => (university === "all" ? true : r.university === university))
      .filter((r) => (!showFaculty || faculty === "all" ? true : r.faculty === faculty))
      .slice()
      .sort((a, b) => winRatio(b.games_played, b.games_won) - winRatio(a.games_played, a.games_won))
  }, [university, faculty, showFaculty])

  return (
    <div className="space-y-4 px-4 pb-4">
      <header className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-gold" />
        <h1 className="text-2xl font-extrabold">Leaderboard</h1>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2.5">
        <Select
          value={university}
          onChange={(e) => {
            setUniversity(e.target.value)
            setFaculty("all")
          }}
        >
          <option value="all">All universities</option>
          {UNIVERSITIES.map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </Select>
        <Select value={faculty} onChange={(e) => setFaculty(e.target.value)} disabled={!showFaculty}>
          <option value="all">All faculties</option>
          {showFaculty &&
            (FACULTIES[university] ?? []).map((f) => (
              <option key={f.value} value={f.value}>{f.value}</option>
            ))}
        </Select>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className="grid grid-cols-[2.5rem_1fr_3rem_3rem] items-center gap-2 border-b border-border px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          <span>#</span>
          <span>Player</span>
          <span className="text-center">GP</span>
          <span className="text-right">Win%</span>
        </div>
        {filtered.map((row, i) => {
          const rank = i + 1
          const ratio = winRatio(row.games_played, row.games_won)
          return (
            <button
              key={row.player_id}
              onClick={() => onOpenPlayer(row.player_id)}
              className="grid w-full grid-cols-[2.5rem_1fr_3rem_3rem] items-center gap-2 border-b border-border/60 px-3 py-3 text-left transition-colors last:border-0 hover:bg-secondary/50"
            >
              <RankBadge rank={rank} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-primary">{row.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {row.university}
                  {row.faculty ? ` · ${row.faculty}` : ""} · {row.games_won}W
                </p>
              </div>
              <span className="text-center text-sm font-semibold tabular-nums">{row.games_played}</span>
              <span
                className={cn(
                  "text-right text-sm font-extrabold tabular-nums",
                  ratio >= 60 ? "text-success" : ratio >= 40 ? "text-gold" : "text-muted-foreground",
                )}
              >
                {ratio}%
              </span>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">No players match these filters.</p>
        )}
      </div>
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const tone = {
      1: "bg-gold/20 text-gold ring-gold/50",
      2: "bg-muted-foreground/20 text-foreground ring-border",
      3: "bg-[oklch(0.55_0.12_50)]/25 text-[oklch(0.7_0.13_50)] ring-[oklch(0.55_0.12_50)]/40",
    }[rank]!
    return (
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-full ring-1", tone)}>
        <Medal className="h-4 w-4" />
      </span>
    )
  }
  return <span className="pl-2.5 text-sm font-bold tabular-nums text-muted-foreground">{rank}</span>
}
