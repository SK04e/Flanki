import * as React from 'react'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { teamLabel } from '@/lib/display'
import type { TeamName } from '@/lib/types'

interface MatchSummaryOverlayProps {
  winner: TeamName
  onDone: () => void
}

export function MatchSummaryOverlay({
  winner,
  onDone,
}: MatchSummaryOverlayProps) {
  const [count, setCount] = React.useState(5)

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          window.clearInterval(id)
          onDone()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [onDone])

  const isBlue = winner === 'A'

  return (
    <div
      className={cn(
        'fixed inset-0 z-[300] flex flex-col items-center justify-center px-6 text-center animate-fade-in',
        isBlue
          ? 'bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.25),#050912_70%)]'
          : 'bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.25),#050912_70%)]',
      )}
    >
      <div
        className={cn(
          'mb-6 flex h-24 w-24 items-center justify-center rounded-3xl ring-2 animate-scale-in',
          isBlue
            ? 'bg-teamA/15 text-teamA ring-teamA/50 shadow-glow-blue'
            : 'bg-teamB/15 text-teamB ring-teamB/50 shadow-glow-red',
        )}
      >
        <Trophy className="h-12 w-12" />
      </div>

      <p className="text-sm font-bold uppercase tracking-[0.4em] text-muted-foreground">
        Mecz zakończony
      </p>
      <h1
        className={cn(
          'mt-3 text-4xl font-black uppercase leading-tight tracking-tight sm:text-5xl',
          isBlue ? 'text-teamA' : 'text-teamB',
        )}
      >
        {teamLabel(winner)}
        <br />
        wygrywa
      </h1>

      <div className="mt-10 flex flex-col items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Powrót do panelu za
        </span>
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] font-mono text-2xl font-black tabular-nums">
          {count}
        </span>
      </div>
    </div>
  )
}
