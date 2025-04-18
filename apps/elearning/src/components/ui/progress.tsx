'use client'

import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export interface ProgressProps
  extends Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, 'color'>,
    VariantProps<typeof progress> {}

export const Progress = ({ className, color, value, ...props }: ProgressProps) => (
  <ProgressPrimitive.Root className={cn(progress({ className, color }), className)} data-slot="progress" {...props}>
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
)

export const progress = cva(
  [
    'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
    '[&>div]:h-full [&>div]:w-full [&>div]:flex-1 [&>div]:transition-all',
  ],
  {
    defaultVariants: {
      color: 'default',
    },
    variants: {
      color: {
        default: 'bg-muted-foreground/20 [&>div]:bg-muted-foreground',
        primary: 'bg-primary-accent/20 [&>div]:bg-primary-accent',
        secondary: 'bg-secondary/20 [&>div]:bg-secondary',
        tertiary: 'bg-tertiary/20 [&>div]:bg-tertiary',
        success: 'bg-success/20 [&>div]:bg-success',
      },
    },
  },
)
