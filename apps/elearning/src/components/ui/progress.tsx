'use client'

import { Root, Indicator } from '@radix-ui/react-progress'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export interface ProgressProps
  extends Omit<React.ComponentProps<typeof Root>, 'color'>,
    VariantProps<typeof progress> {}

export const Progress = ({ className, color, value, ...props }: ProgressProps) => (
  <Root className={cn(progress({ className, color }), className)} data-slot="progress" {...props}>
    <Indicator data-slot="progress-indicator" style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
  </Root>
)

export const progress = cva(
  `
    relative h-2 w-full overflow-hidden rounded-full bg-brand-secondary/20
    [&>div]:h-full [&>div]:w-full [&>div]:flex-1 [&>div]:transition-all
  `,
  {
    defaultVariants: {
      color: 'default',
    },
    variants: {
      color: {
        default: 'bg-muted-foreground/20 [&>div]:bg-muted-foreground',
        brand: 'bg-brand/20 [&>div]:bg-brand',
        'brand-secondary': 'bg-brand-secondary-accent/20 [&>div]:bg-brand-secondary-accent',
        'brand-tertiary': 'bg-brand-tertiary/20 [&>div]:bg-brand-tertiary',
        success: 'bg-success/20 [&>div]:bg-success',
      },
    },
  }
)
