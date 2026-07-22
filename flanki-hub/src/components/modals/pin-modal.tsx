import * as React from 'react'
import { KeyRound, Lock } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import type { Game } from '@/lib/types'

interface PinModalProps {
  open: boolean
  game: Game | null
  onClose: () => void
  onSubmit: (pin: string) => void
}

export function PinModal({ open, game, onClose, onSubmit }: PinModalProps) {
  const [digits, setDigits] = React.useState(['', '', '', ''])
  const inputs = React.useRef<(HTMLInputElement | null)[]>([])

  React.useEffect(() => {
    if (open) {
      setDigits(['', '', '', ''])
      // focus first field shortly after mount
      const id = window.setTimeout(() => inputs.current[0]?.focus(), 50)
      return () => window.clearTimeout(id)
    }
  }, [open])

  function setDigit(index: number, value: string) {
    const v = value.replace(/\D/g, '').slice(-1)
    setDigits((prev) => {
      const next = [...prev]
      next[index] = v
      return next
    })
    if (v && index < 3) inputs.current[index + 1]?.focus()
  }

  function onKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (text.length) {
      e.preventDefault()
      const next = ['', '', '', '']
      text.split('').forEach((c, i) => (next[i] = c))
      setDigits(next)
      inputs.current[Math.min(text.length, 3)]?.focus()
    }
  }

  const pin = digits.join('')
  const complete = pin.length === 4

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-teamA" /> Wpisz kod PIN
        </span>
      }
      description={
        game
          ? `Dołączasz do lobby #${game.game_id} hostowanego przez ${game.host_name}.`
          : undefined
      }
    >
      <div
        className="mb-5 flex justify-center gap-3"
        onPaste={onPaste}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el
            }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            inputMode="numeric"
            maxLength={1}
            className="h-16 w-14 rounded-2xl border border-white/10 bg-white/[0.04] text-center font-mono text-3xl font-black text-teamA focus:border-teamA/60 focus:outline-none focus:ring-2 focus:ring-teamA/40"
          />
        ))}
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!complete}
        onClick={() => onSubmit(pin)}
      >
        <Lock className="h-4 w-4" /> Dołącz do lobby
      </Button>
    </Modal>
  )
}
