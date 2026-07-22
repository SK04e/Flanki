"use client"

import { Home, Trophy, User, Swords } from "lucide-react"
import { cn } from "@/lib/utils"

export type Tab = "home" | "lobby" | "leaderboard" | "profile"

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
  lobbyActive: boolean
}

const items: { tab: Tab; label: string; icon: typeof Home }[] = [
  { tab: "home", label: "Home", icon: Home },
  { tab: "leaderboard", label: "Ranks", icon: Trophy },
  { tab: "lobby", label: "Lobby", icon: Swords },
  { tab: "profile", label: "Profile", icon: User },
]

export function BottomNav({ active, onChange, lobbyActive }: BottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border bg-card/90 backdrop-blur-xl"
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ tab, label, icon: Icon }) => {
          const isActive = active === tab
          const isLobby = tab === "lobby"
          return (
            <li key={tab} className="flex-1">
              <button
                onClick={() => onChange(tab)}
                className={cn(
                  "relative flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="relative">
                  <Icon className={cn("h-5 w-5", isActive && "text-glow-blue")} />
                  {isLobby && lobbyActive && (
                    <span className="absolute -right-1.5 -top-1 flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                    </span>
                  )}
                </span>
                {label}
                {isActive && <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary" />}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
