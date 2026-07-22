import {
  Award,
  BookOpen,
  Clock,
  GraduationCap,
  Hash,
  LogOut,
  ScrollText,
  Settings,
  Swords,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import * as React from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { winRatio } from '@/lib/utils'
import { FACULTY_LABELS, UNIVERSITY_LABELS } from '@/lib/constants'
import { teamFromValue, teamShort } from '@/lib/display'
import type { MatchHistoryEntry, PlayerProfile } from '@/lib/types'

interface ProfileScreenProps {
  profile: PlayerProfile
  history: MatchHistoryEntry[]
  totalPlaytime?: string
  onOpenRules: () => void
  onOpenAchievements: () => void
  onDeleteAccount: () => void
  onLogout: () => void
}

function StatCell({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className={cn('h-3.5 w-3.5', accent)} />
        {label}
      </div>
      <div className="mt-1 truncate text-lg font-bold tabular-nums">{value}</div>
    </div>
  )
}

export function ProfileScreen({
  profile,
  history,
  totalPlaytime = '—',
  onOpenRules,
  onOpenAchievements,
  onDeleteAccount,
  onLogout,
}: ProfileScreenProps) {
  const wr = winRatio(profile.games_played, profile.games_won)

  return (
    <div className="space-y-5">
      {/* Identity card */}
      <Card className="border-teamA/20 bg-gradient-to-br from-teamA/[0.1] to-transparent">
        <CardContent className="flex items-center gap-4 p-5">
          <Avatar
            name={profile.name}
            variant="blue"
            className="h-16 w-16 text-xl"
          />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black tracking-tight">
              {profile.name}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {profile.university
                ? UNIVERSITY_LABELS[profile.university]
                : 'Brak uczelni'}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <Badge variant="gold">
                <Trophy className="h-3 w-3" /> {wr}% WR
              </Badge>
              <Badge variant="muted">ID: {profile.player_id}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatCell
          icon={Hash}
          label="Player ID"
          value={profile.player_id}
          accent="text-teamA"
        />
        <StatCell
          icon={Clock}
          label="Czas gry"
          value={totalPlaytime}
          accent="text-teamA"
        />
        <StatCell
          icon={GraduationCap}
          label="Uczelnia"
          value={profile.university ?? '—'}
          accent="text-teamA"
        />
        <StatCell
          icon={BookOpen}
          label="Wydział"
          value={
            profile.faculty ? (
              <span title={FACULTY_LABELS[profile.faculty]}>
                {profile.faculty}
              </span>
            ) : (
              '—'
            )
          }
          accent="text-teamA"
        />
        <StatCell
          icon={Swords}
          label="Rozegrane"
          value={profile.games_played}
        />
        <StatCell
          icon={Trophy}
          label="Wygrane"
          value={profile.games_won}
          accent="text-success"
        />
        <StatCell
          icon={Target}
          label="Przegrane"
          value={profile.games_lost}
          accent="text-teamB"
        />
        <StatCell
          icon={TrendingUp}
          label="Win Ratio"
          value={`${wr}%`}
          accent="text-gold"
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="lg" onClick={onOpenRules}>
          <ScrollText className="h-5 w-5 text-teamA" /> Zasady gry
        </Button>
        <Button variant="outline" size="lg" onClick={onOpenAchievements}>
          <Award className="h-5 w-5 text-gold" /> Osiągnięcia
        </Button>
      </div>

      {/* Match history */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <ScrollText className="h-5 w-5 text-teamA" /> Historia meczów
        </h2>
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1fr_5rem_4.5rem] gap-2 border-b border-white/10 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            <span>Data</span>
            <span className="text-center">Drużyna</span>
            <span className="text-right">Wynik</span>
          </div>
          <div className="divide-y divide-white/5">
            {history.map((m) => {
              const team = teamFromValue(m['Twoja drużyna'])
              const won =
                m.zwyciezcy !== null && m.zwyciezcy === m['Twoja drużyna']
              return (
                <div
                  key={m['ID gry']}
                  className="grid grid-cols-[1fr_5rem_4.5rem] items-center gap-2 px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-medium">{m.date}</div>
                    <div className="text-[10px] text-muted-foreground">
                      Gra #{m['ID gry']}
                    </div>
                  </div>
                  <div className="flex justify-center">
                    {team ? (
                      <Badge variant={team === 'A' ? 'blue' : 'red'}>
                        {teamShort(team)}
                      </Badge>
                    ) : (
                      <Badge variant="muted">—</Badge>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Badge variant={won ? 'green' : 'red'}>
                      {won ? 'WIN' : 'LOSS'}
                    </Badge>
                  </div>
                </div>
              )
            })}
            {history.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Brak rozegranych meczów.
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Account settings */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Settings className="h-5 w-5 text-muted-foreground" /> Ustawienia konta
        </h2>
        <Card>
          <CardContent className="space-y-2 p-4">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" /> Wyloguj się
            </Button>
            <button
              onClick={onDeleteAccount}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-muted-foreground/70 transition-colors hover:text-teamB"
            >
              <Trash2 className="h-3.5 w-3.5" /> Usuń konto
            </button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
