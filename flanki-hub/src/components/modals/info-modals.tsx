import * as React from 'react'
import {
  Crown,
  Flag,
  Flame,
  Lock,
  MapPin,
  Medal,
  Rocket,
  Shield,
  Swords,
  Timer,
  Trophy,
  Users,
} from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/utils'
import { ACHIEVEMENTS, GAME_RULES } from '@/lib/mock-data'

type IconType = React.ComponentType<{ className?: string }>

const ICONS: Record<string, IconType> = {
  Crown,
  Flag,
  Flame,
  Lock,
  MapPin,
  Medal,
  Rocket,
  Shield,
  Swords,
  Timer,
  Trophy,
  Users,
}

function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = ICONS[name] ?? Trophy
  return <Cmp className={className} />
}

export function RulesModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Zasady gry"
      description="Jak rozgrywa się mecz Flanki."
    >
      <ul className="space-y-3">
        {GAME_RULES.map((rule, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teamA/15 text-teamA">
              <Icon name={rule.icon} className="h-4 w-4" />
            </span>
            <span className="text-sm leading-relaxed text-foreground/90">
              {rule.text}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  )
}

export function AchievementsModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const earned = ACHIEVEMENTS.filter((a) => a.earned).length

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Osiągnięcia"
      description={`Zdobyto ${earned} z ${ACHIEVEMENTS.length} odznak.`}
    >
      <div className="grid grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((a) => (
          <div
            key={a.id}
            className={cn(
              'flex flex-col items-center rounded-2xl border p-4 text-center transition-colors',
              a.earned
                ? 'border-gold/30 bg-gold/[0.08]'
                : 'border-white/10 bg-white/[0.02] opacity-50',
            )}
          >
            <span
              className={cn(
                'mb-2 flex h-12 w-12 items-center justify-center rounded-xl',
                a.earned ? 'bg-gold/20 text-gold' : 'bg-white/10 text-muted-foreground',
              )}
            >
              <Icon name={a.icon} className="h-6 w-6" />
            </span>
            <span className="text-sm font-bold">{a.title}</span>
            <span className="mt-1 text-[10px] leading-tight text-muted-foreground">
              {a.description}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  )
}
