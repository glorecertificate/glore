'use client'

import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const emptySpinnerProps: React.ComponentProps<typeof Spinner> = {}

export const LoadingFallback = ({
  className,
  size = 'auto',
  spinner = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: 'auto' | 'full'
  spinner?: boolean | React.ComponentProps<typeof Spinner>
}) => {
  const { variant = 'colored', ...spinnerProps } = typeof spinner === 'boolean' ? emptySpinnerProps : spinner

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
