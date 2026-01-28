'use client'

import type React from 'react'

import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export const LoadingFallback = ({
  className,
  size = 'auto',
  spinner = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: 'auto' | 'full'
  spinner?: boolean | React.ComponentProps<typeof Spinner>
}) => {
  const { variant = 'colored', ...spinnerProps } = typeof spinner === 'boolean' ? {} : spinner

  return (
    <div
      className={cn(
        'flex cursor-wait items-center justify-center',
        size === 'full' && 'h-full min-h-svh pb-8',
        className
      )}
      {...props}
    >
      {spinner && <Spinner size="lg" variant={variant} {...spinnerProps} />}
    </div>
  )
}
