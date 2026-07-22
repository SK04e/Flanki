import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  className?: string
  variant?: 'default' | 'blue' | 'red' | 'gold'
}

const variantClasses: Record<NonNullable<AvatarProps['variant']>, string> = {
  default: 'bg-white/10 text-foreground border-white/15',
  blue: 'bg-teamA/20 text-teamA border-teamA/40',
  red: 'bg-teamB/20 text-teamB border-teamB/40',
  gold: 'bg-gold/20 text-gold border-gold/40',
}

function computeInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({ name, className, variant = 'default' }: AvatarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full border font-bold uppercase',
        variantClasses[variant],
        className,
      )}
    >
      {computeInitials(name)}
    </div>
  )
}
