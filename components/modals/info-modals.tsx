"use client"

import {
  Users,
  Flag,
  Hand,
  Timer,
  Trophy,
  ShieldCheck,
  Crown,
  Swords,
  Shield,
  Moon,
  Flame,
  Medal,
  type LucideIcon,
} from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { RULES, achievements } from "@/lib/mock-data"

const ruleIcons: Record<string, LucideIcon> = {
  users: Users,
  flag: Flag,
  hand: Hand,
  timer: Timer,
  trophy: Trophy,
  "shield-check": ShieldCheck,
}

const achievementIcons: Record<string, LucideIcon> = {
  crown: Crown,
  swords: Swords,
  shield: Shield,
  moon: Moon,
  flame: Flame,
  medal: Medal,
}

export function RulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="How to play Flanki" description="Capture the flag, outsmart the enemy team.">
      <ul className="space-y-3">
        {RULES.map((rule, i) => {
          const Icon = ruleIcons[rule.icon] ?? Flag
          return (
            <li key={i} className="flex items-start gap-3 rounded-2xl bg-secondary/50 p-3 ring-1 ring-border">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-sm leading-relaxed text-pretty">{rule.text}</p>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}

export function AchievementsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Achievements" description="Badges you've earned on the field.">
      <div className="grid grid-cols-2 gap-3">
        {achievements.map((a) => {
          const Icon = achievementIcons[a.icon] ?? Medal
          return (
            <div
              key={a.id}
              className={`flex flex-col items-center gap-2 rounded-2xl p-4 text-center ring-1 ${
                a.earned ? "bg-gold/10 ring-gold/40 glow-gold" : "bg-secondary/40 ring-border opacity-55"
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  a.earned ? "bg-gold/20 text-gold" : "bg-secondary text-muted-foreground"
                }`}
              >
                <Icon className="h-6 w-6" />
              </span>
              <p className="text-sm font-bold">{a.title}</p>
              <p className="text-[11px] leading-tight text-muted-foreground text-pretty">{a.description}</p>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
