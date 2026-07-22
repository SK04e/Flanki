"use client"

import * as React from "react"
import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface MatchSummaryOverlayProps {
  winner: "A" | "B"
  onDone: () => void
}

export function MatchSummaryOverlay({ winner, onDone }: MatchSummaryOverlayProps) {
  const [count, setCount] = React.useState(5)
  const isBlue = winner === "A"

  // Keep the latest onDone without re-triggering the countdown effect.
  const onDoneRef = React.useRef(onDone)
  React.useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  // Run the countdown exactly once on mount.
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(interval)
          onDoneRef.current()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-background/95 px-6 text-center backdrop-blur-md">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-1/4 mx-auto h-72 w-72 rounded-full blur-[120px]",
          isBlue ? "bg-primary/40" : "bg-destructive/40",
        )}
      />
      <div className="animate-pop-in relative flex flex-col items-center">
        <span
          className={cn(
            "flex h-24 w-24 items-center justify-center rounded-3xl",
            isBlue ? "bg-primary/20 text-primary glow-blue" : "bg-destructive/20 text-destructive glow-red",
          )}
        >
          <Trophy className="h-12 w-12" />
        </span>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground">Match Ended</p>
        <h1
          className={cn(
            "mt-2 text-4xl font-black leading-tight text-balance",
            isBlue ? "text-primary text-glow-blue" : "text-destructive",
          )}
        >
          {isBlue ? "BLUE TEAM" : "RED TEAM"}
          <br />
          WON
        </h1>
        <p className="mt-6 text-sm text-muted-foreground">
          Returning to Dashboard in <span className="font-bold text-foreground">{count}</span>
        </p>
      </div>
    </div>
  )
}
