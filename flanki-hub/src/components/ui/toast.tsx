import * as React from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  dismissToast,
  subscribeToasts,
  type ToastItem,
  type ToastVariant,
} from './toast-store'

const iconMap: Record<ToastVariant, React.ComponentType<{ className?: string }>> =
  {
    info: Info,
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
  }

const colorMap: Record<ToastVariant, string> = {
  info: 'border-teamA/40 text-teamA',
  success: 'border-success/40 text-success',
  error: 'border-teamB/40 text-teamB',
  warning: 'border-gold/40 text-gold',
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  React.useEffect(() => subscribeToasts(setToasts), [])

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => {
        const Icon = iconMap[t.variant]
        return (
          <button
            key={t.id}
            onClick={() => dismissToast(t.id)}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border bg-[#0e1626]/95 px-4 py-3 text-left text-sm font-medium shadow-2xl shadow-black/50 backdrop-blur-2xl animate-slide-up',
              colorMap[t.variant],
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="text-foreground">{t.message}</span>
          </button>
        )
      })}
    </div>
  )
}
