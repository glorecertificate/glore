'use client'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'

interface FilterRailOption {
  count?: number
  label: string
  tone?: StatusTone
  value: string
}

export interface FilterRailGroup {
  id: string
  label: string
  onChange: (value: string | null) => void
  options: FilterRailOption[]
  value: string | null
}

export interface FilterRailProps {
  extra?: React.ReactNode
  groups: FilterRailGroup[]
  onReset: () => void
  search?: (placement: 'panel' | 'toolbar') => React.ReactNode
  searchActive?: boolean
}

const activeCount = (groups: FilterRailGroup[]) => groups.filter(group => group.value !== null).length

const FilterRailGroups = ({ extra, groups }: Pick<FilterRailProps, 'extra' | 'groups'>) => (
  <>
    {groups.map(group => (
      <fieldset className="flex min-w-0 flex-col gap-1" data-slot="filter-rail-group" key={group.id}>
        <legend className="mb-1 type-label text-fg-title">{group.label}</legend>
        {group.options.map(option => {
          const checked = group.value === option.value
          return (
            <label
              className="flex min-h-8 cursor-pointer items-center gap-2.5 text-sm text-foreground"
              key={option.value}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={next => group.onChange(next === true ? option.value : null)}
              />
              <span className="min-w-0 flex-1 truncate">
                {option.tone ? <StatusBadge tone={option.tone}>{option.label}</StatusBadge> : option.label}
              </span>
              {option.count !== undefined && (
                <span className="text-xs text-muted-foreground tabular-nums">{option.count}</span>
              )}
            </label>
          )
        })}
      </fieldset>
    ))}
    {extra}
  </>
)

export const FilterRailPanel = ({
  className,
  extra,
  groups,
  onReset,
  search,
  searchActive = false,
}: FilterRailProps & { className?: string }) => {
  const t = useTranslations('Common')
  const active = activeCount(groups) > 0 || searchActive

  return (
    <aside
      aria-label={t('filters')}
      className={cn(
        'flex w-62 shrink-0 flex-col gap-5 border-r border-border-subtle bg-surface-muted/40 p-5',
        className
      )}
      data-slot="filter-rail"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="type-heading text-fg-title">{t('filters')}</h2>
        {active && (
          <Button className="-mr-2 text-action-text" onClick={onReset} size="xs" type="button" variant="ghost">
            {t('reset')}
          </Button>
        )}
      </div>
      {search?.('panel')}
      <FilterRailGroups extra={extra} groups={groups} />
    </aside>
  )
}

export const FilterRailToolbar = ({ extra, groups, onReset, search, searchActive = false }: FilterRailProps) => {
  const t = useTranslations('Common')
  const tDialog = useTranslations('Components.Dialog')
  const count = activeCount(groups)

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:hidden" data-slot="filter-rail-toolbar">
      <div className="min-w-0 basis-full *:w-full sm:flex-1 sm:basis-0 [&_input]:w-full">{search?.('toolbar')}</div>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            aria-label={count > 0 ? t('filtersActive', { count }) : undefined}
            className="shrink-0"
            size="sm"
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
        <SheetContent className="max-h-dialog gap-0 rounded-t-2xl" closeSrText={tDialog('close')} side="bottom">
          <SheetHeader className="pr-12">
            <SheetTitle>{t('filters')}</SheetTitle>
            <SheetDescription className="sr-only">{t('filtersDescription')}</SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
            <FilterRailGroups extra={extra} groups={groups} />
          </div>
          <SheetFooter className="mt-0 flex-row gap-2 border-t pb-sheet-footer">
            <Button className="flex-1" disabled={count === 0 && !searchActive} onClick={onReset} variant="outline">
              {t('reset')}
            </Button>
            <SheetClose asChild>
              <Button className="flex-1" variant="primary">
                {t('done')}
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export const FilterRailChips = ({ groups }: Pick<FilterRailProps, 'groups'>) => {
  const t = useTranslations('Common')
  const chips = groups.flatMap(group => {
    const option = group.options.find(item => item.value === group.value)
    return option ? [{ group, label: option.label }] : []
  })

  if (chips.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-2" data-slot="filter-chips">
      {chips.map(({ group, label }) => (
        <li key={group.id}>
          <button
            aria-label={t('removeFilter', { name: `${group.label}: ${label}` })}
            className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-action-border bg-action-subtle px-3 text-sm font-medium text-action-text transition-colors duration-100 outline-none hover:bg-action-subtle/70 focus-visible:focus-ring"
            onClick={() => group.onChange(null)}
            type="button"
          >
            {`${group.label}: ${label}`}
            <LucideIcon className="size-3.5" name="x" />
          </button>
        </li>
      ))}
    </ul>
  )
}
