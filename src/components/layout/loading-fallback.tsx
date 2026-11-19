'use client'

import { useTranslations } from 'next-intl'

import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const emptySpinnerProps: React.ComponentProps<typeof Spinner> = {}

const DefaultLabel = () => {
  const t = useTranslations('Common')
  return t('loading')
}

export const LoadingFallback = ({
  className,
  delay = true,
  label,
  size = 'auto',
  spinner = true,
  ...props
}: React.ComponentProps<'output'> & {
  delay?: boolean
  label?: React.ReactNode
  size?: 'auto' | 'full'
  spinner?: boolean | React.ComponentProps<typeof Spinner>
}) => {
  const { variant = 'colored', ...spinnerProps } = typeof spinner === 'boolean' ? emptySpinnerProps : spinner

  return (
    <output
      className={cn(
        'flex animate-in cursor-wait items-center justify-center duration-500 fill-mode-backwards fade-in',
        delay && 'delay-300',
        size === 'full' && 'h-full min-h-svh pb-8',
        className
      )}
      data-slot="loading-fallback"
      {...props}
    >
      {spinner && <Spinner aria-hidden size="lg" variant={variant} {...spinnerProps} />}
      {label !== null && <span className="sr-only">{label ?? <DefaultLabel />}</span>}
    </output>
  )
}
