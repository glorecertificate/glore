'use client'

import { useMemo } from 'react'

import * as ProgressPrimitive from '@radix-ui/react-progress'
import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export const Progress = ({
  className,
  color,
  value,
  ...props
}: Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, keyof VariantProps<typeof progressVariants>> &
  VariantProps<typeof progressVariants>) => {
  const indicatorStyle = useMemo(() => ({ transform: `translateX(-${100 - (value || 0)}%)` }), [value])
  return (
    <ProgressPrimitive.Root
      className={cn(progressVariants({ className, color }), className)}
      data-slot="progress"
      {...props}
    >
      <ProgressPrimitive.Indicator data-slot="progress-indicator" style={indicatorStyle} />
    </ProgressPrimitive.Root>
  )
}

const progressVariants = cva(
  `relative h-2 w-full overflow-hidden rounded-full bg-brand-secondary/20 [&>div]:h-full [&>div]:w-full [&>div]:flex-1 [&>div]:transition-all`,
  {
    defaultVariants: {
      color: 'default',
    },
    variants: {
      color: {
        brand: 'bg-brand/20 [&>div]:bg-brand',
        'brand-secondary': 'bg-brand-secondary-accent/20 [&>div]:bg-brand-secondary-accent',
        'brand-tertiary': 'bg-brand-tertiary/20 [&>div]:bg-brand-tertiary',
        default: 'bg-muted-foreground/20 [&>div]:bg-muted-foreground',
        success: 'bg-success/20 [&>div]:bg-success',
      },
    },
  }
)
