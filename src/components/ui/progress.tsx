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
      value={typeof value === 'number' ? percent : value}
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
  action: 'bg-gradient-action',
  approved: 'bg-status-approved',
  brand: 'bg-linear-to-r from-chart-teal to-stat-teal-strip-to',
  'brand-secondary': 'bg-brand-secondary-accent',
  'brand-tertiary': 'bg-status-submitted',
  changes: 'bg-status-changes',
  default: 'bg-muted-foreground',
  draft: 'bg-status-draft',
  rejected: 'bg-status-rejected',
  review: 'bg-status-review',
  revoked: 'bg-status-revoked',
  submitted: 'bg-status-submitted',
  success: 'bg-status-approved',
  warning: 'bg-status-changes',
  withdrawn: 'bg-status-withdrawn',
} as const

const progressVariants = cva('relative h-2 w-full overflow-hidden rounded-full bg-status-track', {
  defaultVariants: {
    color: 'default',
  },
  variants: {
    color: Object.fromEntries(Object.keys(FILLS).map(key => [key, ''])) as Record<keyof typeof FILLS, string>,
  },
})
