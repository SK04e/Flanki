"use client"

import * as React from "react"
import { Lock } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"

interface PinModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (pin: string) => void
  lobbyId: number
  correctPin: number
}

export function PinModal({ open, onClose, onSubmit, lobbyId, correctPin }: PinModalProps) {
  const [digits, setDigits] = React.useState<string[]>(["", "", "", ""])
  const [error, setError] = React.useState(false)
  const inputs = React.useRef<(HTMLInputElement | null)[]>([])

  React.useEffect(() => {
    if (open) {
      setDigits(["", "", "", ""])
      setError(false)
      setTimeout(() => inputs.current[0]?.focus(), 50)
    }
  }, [open])

  const setDigit = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[i] = val
    setDigits(next)
    setError(false)
    if (val && i < 3) inputs.current[i + 1]?.focus()
  }

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  const submit = () => {
    const pin = digits.join("")
    if (pin.length < 4) return
    if (pin === String(correctPin)) {
      onSubmit(pin)
    } else {
      setError(true)
      setDigits(["", "", "", ""])
      inputs.current[0]?.focus()
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Join Lobby #${lobbyId}`} description="Enter the 4-digit PIN shared by the host.">
      <div className="flex items-center justify-center gap-3">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el
            }}
            value={d}
            inputMode="numeric"
            maxLength={1}
            aria-label={`PIN digit ${i + 1}`}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            className={`h-16 w-14 rounded-2xl border-2 bg-secondary/60 text-center text-2xl font-extrabold outline-none transition-colors focus:border-primary ${
              error ? "border-destructive" : "border-border"
            }`}
          />
        ))}
      </div>
      {error && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-destructive">
          <Lock className="h-4 w-4" /> Incorrect PIN, try again
        </p>
      )}
      <p className="mt-3 text-center text-xs text-muted-foreground">Hint (demo): the PIN is {correctPin}</p>
      <Button size="lg" className="mt-5 w-full" onClick={submit} disabled={digits.join("").length < 4}>
        Join Lobby
      </Button>
    </Modal>
  )
}
