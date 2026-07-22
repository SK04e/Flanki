import * as React from 'react'
import { Crown, Medal, Trophy } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { winRatio } from '@/lib/utils'
import {
  FACULTIES,
  UNIVERSITIES,
  UNIVERSITY_LABELS,
} from '@/lib/constants'
import type { PlayerProfile } from '@/lib/types'

interface LeaderboardScreenProps {
  players: PlayerProfile[]
  onOpenProfile: (playerId: number) => void
}

const RANK_STYLES = [
  'bg-gold/20 text-gold border-gold/50', // #1
  'bg-slate-300/20 text-slate-200 border-slate-300/40', // #2
  'bg-amber-700/25 text-amber-500 border-amber-600/50', // #3
]

export function LeaderboardScreen({
  players,
  onOpenProfile,
}: LeaderboardScreenProps) {
  const [uni, setUni] = React.useState('ALL')
  const [fac, setFac] = React.useState('ALL')

  const filtered = React.useMemo(() => {
    return players
      .filter((p) => (uni === 'ALL' ? true : p.university === uni))
      .filter((p) => (fac === 'ALL' ? true : p.faculty === fac))
      .slice()
      .sort((a, b) => b.games_won - a.games_won)
  }, [players, uni, fac])

  const facultyDisabled = uni === 'Other'

  return (
    <div className="space-y-5">
      <header className="pt-1">
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
          <Trophy className="h-6 w-6 text-gold" /> Ranking
        </h1>
        <p className="text-sm text-muted-foreground">
          Najlepsi gracze Flanki Hub
        </p>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Uczelnia</Label>
          <Select
            value={uni}
            onValueChange={(v) => {
              setUni(v)
              if (v === 'Other') setFac('ALL')
            }}
            options={[
              { value: 'ALL', label: 'Wszystkie' },
              ...UNIVERSITIES.map((u) => ({ value: u.value, label: u.label })),
            ]}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Wydział</Label>
          <Select
            value={fac}
            onValueChange={setFac}
            disabled={facultyDisabled}
            options={[
              { value: 'ALL', label: 'Wszystkie' },
              ...FACULTIES.map((f) => ({ value: f.value, label: f.label })),
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[2.5rem_1fr_3rem_3rem_3.5rem] items-center gap-2 border-b border-white/10 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          <span className="text-center">#</span>
          <span>Gracz</span>
          <span className="text-center">Gry</span>
          <span className="text-center">Wyg.</span>
          <span className="text-center">WR%</span>
        </div>

        <div className="divide-y divide-white/5">
          {filtered.map((p, i) => {
            const rank = i + 1
            const wr = winRatio(p.games_played, p.games_won)
            return (
              <div
                key={p.player_id}
                className="grid grid-cols-[2.5rem_1fr_3rem_3rem_3.5rem] items-center gap-2 px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex justify-center">
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-black tabular-nums',
                      rank <= 3
                        ? RANK_STYLES[rank - 1]
                        : 'border-white/10 bg-white/[0.03] text-muted-foreground',
                    )}
                  >
                    {rank}
                  </span>
                </div>
                <button
                  onClick={() => onOpenProfile(p.player_id)}
                  className="flex min-w-0 items-center gap-2 text-left"
                >
                  <Avatar
                    name={p.name}
                    variant={rank === 1 ? 'gold' : 'default'}
                    className="h-8 w-8 text-[10px]"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm font-semibold text-teamA hover:underline">
                        {p.name}
                      </span>
                      {rank === 1 && (
                        <Crown className="h-3 w-3 shrink-0 text-gold" />
                      )}
                    </div>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {p.university
                        ? UNIVERSITY_LABELS[p.university]
                        : 'Brak uczelni'}
                    </span>
                  </div>
                </button>
                <span className="text-center text-sm tabular-nums">
                  {p.games_played}
                </span>
                <span className="text-center text-sm font-semibold tabular-nums text-success">
                  {p.games_won}
                </span>
                <span
                  className={cn(
                    'text-center text-sm font-bold tabular-nums',
                    wr >= 60
                      ? 'text-success'
                      : wr >= 45
                        ? 'text-gold'
                        : 'text-muted-foreground',
                  )}
                >
                  {wr}%
                </span>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <Medal className="h-8 w-8 opacity-40" />
              Brak graczy dla wybranych filtrów.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
