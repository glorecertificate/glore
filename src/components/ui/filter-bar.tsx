'use client'

import { useRef } from 'react'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useComposedRefs } from '@/hooks/use-composed-refs'
import { cn } from '@/lib/utils'

const FIRST_CONTROL = 'input, button, [role="combobox"]'

interface FilterBarProps extends React.ComponentProps<'div'> {
  active?: boolean
  count?: number
  onClear?: () => void
  search?: React.ReactNode
  size?: 'md' | 'sm'
}

export const FilterBar = ({
  active = false,
  children,
  className,
  count,
  onClear,
  ref,
  search,
  size = 'md',
  ...props
}: FilterBarProps) => {
  const t = useTranslations('Common')
  const tDialog = useTranslations('Components.Dialog')
  const barRef = useRef<HTMLDivElement>(null)
  const composedRef = useComposedRefs(barRef, ref)
  const collapsible = count !== undefined

  const clear = () => {
    onClear?.()
    barRef.current?.querySelector<HTMLElement>(FIRST_CONTROL)?.focus()
  }

  const clearButton = active && onClear && (
    <Button className={cn('shrink-0', collapsible && 'max-sm:hidden')} onClick={clear} size="sm" variant="ghost">
      {t('clearFilters')}
    </Button>
  )

  return (
    <div
      className={cn('flex min-w-0 flex-1 flex-wrap items-center gap-2 pointer-coarse:gap-3', className)}
      data-slot="filter-bar"
      ref={composedRef}
      {...props}
    >
      {search && (
        <div className={cn(collapsible && 'min-w-0 flex-1 max-sm:*:w-full sm:contents max-sm:[&_input]:w-full')}>
          {search}
        </div>
      )}
      {collapsible ? (
        <>
          <div className="contents max-sm:hidden">{children}</div>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                aria-label={count > 0 ? t('filtersActive', { count }) : undefined}
                className="shrink-0 sm:hidden"
                size={size}
                variant="outline"
              >
                <LucideIcon name="sliders-horizontal" />
                {t('filters')}
                {count > 0 && (
                  <Badge className="-mr-1" count={count} variant="brand">
                    <span className="sr-only">{t('filtersActive', { count })}</span>
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              className="max-h-dialog gap-0 rounded-t-2xl sm:hidden"
              closeSrText={tDialog('close')}
              side="bottom"
            >
              <SheetHeader className="pr-12">
                <SheetTitle>{t('filters')}</SheetTitle>
                <SheetDescription className="sr-only">{t('filtersDescription')}</SheetDescription>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4 *:w-full! [&_[data-slot=select-trigger]]:w-full! [&_[data-slot=select-trigger]]:max-w-none!">
                {children}
              </div>
              <SheetFooter className="mt-0 flex-row gap-2 border-t pb-sheet-footer">
                <Button className="flex-1" disabled={!active} onClick={onClear} variant="outline">
                  {t('reset')}
                </Button>
                <SheetClose asChild>
                  <Button className="flex-1" variant="brand">
                    {t('done')}
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </>
      ) : (
        children
      )}
      {clearButton}
    </div>
  )
}
