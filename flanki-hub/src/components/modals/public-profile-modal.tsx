import { GraduationCap, Swords, Target, TrendingUp, Trophy } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { winRatio } from '@/lib/utils'
import { FACULTY_LABELS, UNIVERSITY_LABELS } from '@/lib/constants'
import type { PlayerProfile } from '@/lib/types'

interface PublicProfileModalProps {
  open: boolean
  player: PlayerProfile | null
  onClose: () => void
}

export function PublicProfileModal({
  open,
  player,
  onClose,
}: PublicProfileModalProps) {
  if (!player) return null
  const wr = winRatio(player.games_played, player.games_won)

  const stats = [
    { icon: Swords, label: 'Rozegrane', value: player.games_played, accent: '' },
    { icon: Trophy, label: 'Wygrane', value: player.games_won, accent: 'text-success' },
    { icon: Target, label: 'Przegrane', value: player.games_lost, accent: 'text-teamB' },
    { icon: TrendingUp, label: 'Win Ratio', value: `${wr}%`, accent: 'text-gold' },
  ]

  return (
    <Modal open={open} onClose={onClose}>
      <div className="mb-5 flex flex-col items-center text-center">
        <Avatar name={player.name} variant="blue" className="h-20 w-20 text-2xl" />
        <h2 className="mt-3 text-2xl font-black tracking-tight">{player.name}</h2>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <GraduationCap className="h-4 w-4" />
          {player.university ? UNIVERSITY_LABELS[player.university] : 'Brak uczelni'}
        </div>
        {player.faculty && (
          <Badge variant="muted" className="mt-2">
            {FACULTY_LABELS[player.faculty]}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center"
          >
            <s.icon className={`mx-auto mb-1 h-4 w-4 ${s.accent || 'text-teamA'}`} />
            <div className="text-xl font-black tabular-nums">{s.value}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
