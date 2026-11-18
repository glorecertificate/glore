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
        className="size-full rounded-full bg-(--progress-fill) transition-transform duration-300 ease-out motion-reduce:transition-none"
        data-slot="progress-indicator"
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

const progressVariants = cva('relative h-2 w-full overflow-hidden rounded-full bg-(--progress-track)', {
  defaultVariants: {
    color: 'default',
  },
  variants: {
    color: {
      action: '[--progress-fill:var(--action)] [--progress-track:var(--action-subtle)]',
      brand: '[--progress-fill:var(--brand)] [--progress-track:color-mix(in_oklab,var(--brand)_20%,transparent)]',
      'brand-secondary':
        '[--progress-fill:var(--brand-secondary-accent)] [--progress-track:color-mix(in_oklab,var(--brand-secondary-accent)_20%,transparent)]',
      'brand-tertiary':
        '[--progress-fill:var(--brand-tertiary)] [--progress-track:color-mix(in_oklab,var(--brand-tertiary)_20%,transparent)]',
      default:
        '[--progress-fill:var(--muted-foreground)] [--progress-track:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)]',
      success: '[--progress-fill:var(--success)] [--progress-track:color-mix(in_oklab,var(--success)_20%,transparent)]',
      warning: '[--progress-fill:var(--warning)] [--progress-track:color-mix(in_oklab,var(--warning)_20%,transparent)]',
    },
  },
})
