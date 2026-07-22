import { type ComponentType } from 'react'
import { Search, Swords, Trophy, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TabKey = 'search' | 'lobby' | 'leaderboard' | 'profile'

const TABS: {
  key: TabKey
  label: string
  icon: ComponentType<{ className?: string }>
}[] = [
  { key: 'search', label: 'Szukaj', icon: Search },
  { key: 'lobby', label: 'Lobby', icon: Swords },
  { key: 'leaderboard', label: 'Ranking', icon: Trophy },
  { key: 'profile', label: 'Profil', icon: User },
]

interface BottomNavProps {
  active: TabKey
  onChange: (tab: TabKey) => void
  lobbyActive?: boolean
}

export function BottomNav({ active, onChange, lobbyActive }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b1220]/85 backdrop-blur-2xl">
      <div
        className="mx-auto grid max-w-md grid-cols-4"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map((tab) => {
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={cn(
                'relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors',
                isActive ? 'text-teamA' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="relative">
                <tab.icon className="h-5 w-5" />
                {tab.key === 'lobby' && lobbyActive && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-success shadow-glow-green" />
                )}
              </span>
              {tab.label}
              {isActive && (
                <span className="absolute -top-px h-0.5 w-8 rounded-full bg-teamA shadow-glow-blue" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
