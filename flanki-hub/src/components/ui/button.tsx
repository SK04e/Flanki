import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        default:
          'bg-white/10 text-foreground border border-white/10 hover:bg-white/[0.16]',
        primary:
          'bg-teamA text-slate-950 hover:brightness-110 shadow-glow-blue',
        success:
          'bg-success text-slate-950 hover:brightness-110 shadow-glow-green',
        danger:
          'bg-teamB text-white hover:brightness-110 shadow-glow-red',
        gold: 'bg-gold text-slate-950 hover:brightness-110 shadow-glow-gold',
        outline:
          'border border-white/15 bg-transparent hover:bg-white/[0.06] text-foreground',
        ghost: 'hover:bg-white/[0.06] text-foreground',
        subtleDanger:
          'border border-teamB/40 bg-teamB/10 text-teamB hover:bg-teamB/20',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-14 px-6 text-base',
        xl: 'h-16 px-6 text-lg',
        icon: 'h-10 w-10',
        iconSm: 'h-8 w-8 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
