"use client"

import { MapPin, LocateFixed } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { POLISH_CITIES, CAMPUS_SPOTS } from "@/lib/mock-data"

interface LocationModalProps {
  open: boolean
  onClose: () => void
  onSelect: (location: string, exact: boolean) => void
}

export function LocationModal({ open, onClose, onSelect }: LocationModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Set lobby location" description="Use your live position or pick a spot manually.">
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => onSelect("Current GPS position", true)}
      >
        <LocateFixed className="h-5 w-5" /> Use exact GPS
      </Button>

      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or choose manually <span className="h-px flex-1 bg-border" />
      </div>

      <p className="mb-2 text-xs font-semibold text-muted-foreground">Campus spots</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {CAMPUS_SPOTS.map((c) => (
          <button
            key={c}
            onClick={() => onSelect(c, false)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-2 text-sm font-medium text-primary ring-1 ring-primary/30 transition-colors hover:bg-primary/20"
          >
            <MapPin className="h-3.5 w-3.5" /> {c}
          </button>
        ))}
      </div>

      <p className="mb-2 text-xs font-semibold text-muted-foreground">Cities</p>
      <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto no-scrollbar pr-1">
        {POLISH_CITIES.map((city) => (
          <button
            key={city}
            onClick={() => onSelect(city, false)}
            className="flex items-center gap-2 rounded-xl bg-secondary/70 px-3 py-3 text-left text-sm font-medium ring-1 ring-border transition-colors hover:bg-secondary"
          >
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{city}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
