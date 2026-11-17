'use client'

import { useRef } from 'react'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { useComposedRefs } from '@/hooks/use-composed-refs'
import { cn } from '@/lib/utils'

const FIRST_CONTROL = 'input, button, [role="combobox"]'

interface FilterBarProps extends React.ComponentProps<'div'> {
  active?: boolean
  onClear?: () => void
}

export const FilterBar = ({ active = false, children, className, onClear, ref, ...props }: FilterBarProps) => {
  const t = useTranslations('Common')
  const barRef = useRef<HTMLDivElement>(null)
  const composedRef = useComposedRefs(barRef, ref)

  const clear = () => {
    onClear?.()
    barRef.current?.querySelector<HTMLElement>(FIRST_CONTROL)?.focus()
  }

  return (
    <div
      className={cn('flex min-w-0 flex-1 flex-wrap items-center gap-2', className)}
      data-slot="filter-bar"
      ref={composedRef}
      {...props}
    >
      {children}
      {active && onClear && (
        <Button className="shrink-0" onClick={clear} size="sm" variant="ghost">
          {t('clearFilters')}
        </Button>
      )}
    </div>
  )
}
