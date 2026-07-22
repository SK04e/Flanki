import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
  {
    variants: {
      variant: {
        blue: "bg-primary/15 text-primary ring-1 ring-primary/40",
        red: "bg-destructive/15 text-destructive ring-1 ring-destructive/40",
        green: "bg-success/15 text-success ring-1 ring-success/40",
        gold: "bg-gold/15 text-gold ring-1 ring-gold/40",
        muted: "bg-secondary text-muted-foreground ring-1 ring-border",
        neutral: "bg-secondary text-foreground ring-1 ring-border",
      },
    },
    defaultVariants: { variant: "muted" },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
