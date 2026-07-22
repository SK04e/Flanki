import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  className?: string
  hideClose?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  hideClose,
}: ModalProps) {
  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-md rounded-t-3xl border border-white/10 bg-[#0e1626]/95 p-6 shadow-2xl shadow-black/60 backdrop-blur-2xl animate-slide-up sm:rounded-3xl',
          className,
        )}
      >
        {!hideClose && (
          <Button
            variant="ghost"
            size="iconSm"
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground"
            aria-label="Zamknij"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {(title || description) && (
          <div className="mb-5 pr-8">
            {title && (
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
