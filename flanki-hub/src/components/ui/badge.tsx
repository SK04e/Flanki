import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-white/15 bg-white/[0.06] text-foreground',
        blue: 'border-teamA/40 bg-teamA/15 text-teamA',
        red: 'border-teamB/40 bg-teamB/15 text-teamB',
        green: 'border-success/40 bg-success/15 text-success',
        gold: 'border-gold/40 bg-gold/15 text-gold',
        muted: 'border-white/10 bg-white/[0.04] text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
