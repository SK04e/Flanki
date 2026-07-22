import { cn } from "@/lib/utils"
import { initials } from "@/lib/helpers"

interface AvatarProps {
  name: string
  className?: string
  variant?: "blue" | "red" | "neutral"
}

export function Avatar({ name, className, variant = "neutral" }: AvatarProps) {
  const styles = {
    blue: "bg-primary/20 text-primary ring-primary/40",
    red: "bg-destructive/20 text-destructive ring-destructive/40",
    neutral: "bg-secondary text-foreground ring-border",
  }[variant]

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl font-bold ring-1",
        styles,
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  )
}
