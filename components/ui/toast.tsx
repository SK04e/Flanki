"use client"

import * as React from "react"
import { CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "info" | "warning" | "error"
interface Toast {
  id: number
  message: string
  type: ToastType
}

const ToastCtx = React.createContext<(message: string, type?: ToastType) => void>(() => {})

export function useToast() {
  return React.useContext(ToastCtx)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const push = React.useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
  }, [])

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-success" />,
    info: <Info className="h-5 w-5 text-primary" />,
    warning: <AlertTriangle className="h-5 w-5 text-gold" />,
    error: <XCircle className="h-5 w-5 text-destructive" />,
  }

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "glass animate-slide-up pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg",
            )}
          >
            {icons[t.type]}
            <span className="text-pretty">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
