"use client"

import { useState } from "react"
import { BookOpen, Award, LogOut, TrendingUp, Trophy, Swords } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RulesModal, AchievementsModal } from "@/components/modals/info-modals"
import { currentProfile, achievements } from "@/lib/mock-data"
import { winRatio, teamLabel } from "@/lib/helpers"

export function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const [rulesOpen, setRulesOpen] = useState(false)
  const [achievementsOpen, setAchievementsOpen] = useState(false)
  const p = currentProfile
  const ratio = winRatio(p.games_played, p.games_won)
  const earnedCount = achievements.filter((a) => a.earned).length

  const stats = [
    { label: "Played", value: p.games_played, icon: Swords },
    { label: "Won", value: p.games_won, icon: Trophy },
    { label: "Win Rate", value: `${ratio}%`, icon: TrendingUp },
  ]

  return (
    <div className="space-y-5 pb-4">
      {/* Header card */}
      <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
        <div className="flex items-center gap-4">
          <Avatar name={p.name} variant="blue" className="h-16 w-16 text-xl" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-extrabold tracking-tight">{p.name}</h1>
            <p className="truncate text-sm text-muted-foreground">{p.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="blue">{p.university}</Badge>
              {p.faculty && <Badge variant="muted">{p.faculty}</Badge>}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-secondary/60 p-3 text-center ring-1 ring-border">
              <s.icon className="mx-auto mb-1 h-4 w-4 text-primary" />
              <p className="text-xl font-extrabold">{s.value}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <section className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setAchievementsOpen(true)}
          className="flex items-center gap-3 rounded-2xl bg-card p-4 text-left ring-1 ring-border transition-colors hover:bg-secondary/60"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
            <Award className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold">Achievements</p>
            <p className="text-xs text-muted-foreground">{earnedCount} earned</p>
          </div>
        </button>
        <button
          onClick={() => setRulesOpen(true)}
          className="flex items-center gap-3 rounded-2xl bg-card p-4 text-left ring-1 ring-border transition-colors hover:bg-secondary/60"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold">How to play</p>
            <p className="text-xs text-muted-foreground">Game rules</p>
          </div>
        </button>
      </section>

      {/* Match history */}
      <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Match History</h2>
        <ul className="space-y-2">
          {p.matchHistory.map((m) => {
            const won = m["Twoja drużyna"] === m.zwyciezcy
            return (
              <li
                key={m["ID gry"]}
                className="flex items-center justify-between rounded-2xl bg-secondary/50 p-3 ring-1 ring-border"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-extrabold ring-1 ${
                      won ? "bg-success/15 text-success ring-success/40" : "bg-destructive/15 text-destructive ring-destructive/40"
                    }`}
                  >
                    {won ? "W" : "L"}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Game #{m["ID gry"]}</p>
                    <p className="text-xs text-muted-foreground">{m.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={m["Twoja drużyna"] === "A" ? "blue" : "red"}>
                    Team {teamLabel(m["Twoja drużyna"])}
                  </Badge>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <Button variant="outline" className="w-full" onClick={onLogout}>
        <LogOut className="h-4 w-4" />
        Log out
      </Button>

      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      <AchievementsModal open={achievementsOpen} onClose={() => setAchievementsOpen(false)} />
    </div>
  )
}
