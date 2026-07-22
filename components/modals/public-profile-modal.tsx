"use client"

import { Modal } from "@/components/ui/modal"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getPublicProfile } from "@/lib/mock-data"
import { winRatio } from "@/lib/helpers"

interface PublicProfileModalProps {
  playerId: number | null
  onClose: () => void
}

export function PublicProfileModal({ playerId, onClose }: PublicProfileModalProps) {
  if (playerId == null) return null
  const profile = getPublicProfile(playerId)
  const ratio = winRatio(profile.games_played, profile.games_won)

  const stats = [
    { label: "Played", value: profile.games_played },
    { label: "Won", value: profile.games_won },
    { label: "Lost", value: profile.games_lost },
    { label: "Win %", value: `${ratio}%` },
  ]

  return (
    <Modal open={playerId != null} onClose={onClose} className="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <Avatar name={profile.name} variant="blue" className="h-20 w-20 text-2xl" />
        <h2 className="mt-3 text-xl font-bold">{profile.name}</h2>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Badge variant="blue">{profile.university}</Badge>
          {profile.faculty && <Badge variant="muted">{profile.faculty}</Badge>}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-secondary/60 p-3 text-center ring-1 ring-border">
            <p className="text-lg font-extrabold">{s.value}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </Modal>
  )
}
