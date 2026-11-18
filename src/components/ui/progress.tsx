'use client'

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
  const percent = Math.min(100, Math.max(0, value || 0))
  return (
    <ProgressPrimitive.Root
      className={cn(progressVariants({ color }), className)}
      data-slot="progress"
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'size-full rounded-full transition-transform duration-300 ease-out motion-reduce:transition-none',
          FILLS[color ?? 'default']
        )}
        data-slot="progress-indicator"
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

const FILLS = {
  action: 'bg-action',
  brand: 'bg-brand',
  'brand-secondary': 'bg-brand-secondary-accent',
  'brand-tertiary': 'bg-brand-tertiary',
  default: 'bg-muted-foreground',
  success: 'bg-success',
  warning: 'bg-warning',
} as const

const progressVariants = cva('relative h-2 w-full overflow-hidden rounded-full', {
  defaultVariants: {
    color: 'default',
  },
  variants: {
    color: {
      action: 'bg-action-subtle',
      brand: 'bg-brand/20',
      'brand-secondary': 'bg-brand-secondary-accent/20',
      'brand-tertiary': 'bg-brand-tertiary/20',
      default: 'bg-muted-foreground/20',
      success: 'bg-success/20',
      warning: 'bg-warning/20',
    },
  },
})
