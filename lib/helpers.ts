export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function winRatio(played: number, won: number) {
  if (!played) return 0
  return Math.round((won / played) * 100)
}

export function teamLabel(team: "A" | "B" | null | undefined) {
  if (team === "A") return "BLUE"
  if (team === "B") return "RED"
  return "—"
}

export function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}
