import { Crosshair, MapPin } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { POLISH_CITIES } from '@/lib/constants'

interface LocationModalProps {
  open: boolean
  onClose: () => void
  onSelectCity: (city: string) => void
  onUseGps: () => void
}

export function LocationModal({
  open,
  onClose,
  onSelectCity,
  onUseGps,
}: LocationModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Wybierz lokalizację"
      description="Użyj dokładnego GPS lub wybierz miasto z listy."
    >
      <Button
        variant="primary"
        size="lg"
        className="mb-4 w-full"
        onClick={() => {
          onUseGps()
          onClose()
        }}
      >
        <Crosshair className="h-5 w-5" /> Użyj dokładnego GPS
      </Button>

      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Miasta w Polsce
      </div>
      <div className="grid max-h-72 grid-cols-2 gap-2 overflow-auto pr-1 no-scrollbar">
        {POLISH_CITIES.map((city) => (
          <button
            key={city}
            onClick={() => {
              onSelectCity(city)
              onClose()
            }}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-sm font-medium transition-colors hover:border-teamA/40 hover:bg-teamA/10"
          >
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{city}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
