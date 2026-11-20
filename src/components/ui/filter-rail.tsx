'use client'

import { useId, useState } from 'react'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SearchInput } from '@/components/ui/search'
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

interface FilterRailGroupSearch {
  emptyLabel: string
  placeholder: string
}

export interface FilterRailGroup {
  id: string
  label: string
  onChange: (values: string[]) => void
  options: FilterRailOption[]
  searchable?: FilterRailGroupSearch
  selection?: 'multiple' | 'required' | 'single'
  values: string[]
}

export interface FilterRailProps {
  extra?: React.ReactNode
  groups: FilterRailGroup[]
  onReset: () => void
  search?: (placement: 'panel' | 'toolbar') => React.ReactNode
  searchActive?: boolean
}

const activeCount = (groups: FilterRailGroup[]) =>
  groups.filter(group => group.selection !== 'required' && group.values.length > 0).length

const toggle = (values: string[], value: string, checked: boolean) =>
  checked ? [...values, value] : values.filter(item => item !== value)

const OptionContent = ({ option }: { option: FilterRailOption }) => (
  <>
    <span className="min-w-0 flex-1 truncate" title={option.tone ? undefined : option.label}>
      {option.tone ? <StatusBadge tone={option.tone}>{option.label}</StatusBadge> : option.label}
    </span>
    {option.count !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{option.count}</span>}
  </>
)

const OPTION_CLASS = 'flex min-h-8 cursor-pointer items-center gap-2.5 text-sm text-foreground'

const SingleGroup = ({ group }: { group: FilterRailGroup }) => {
  const t = useTranslations('Common')
  const prefix = useId()
  const clearable = group.selection === 'single' && group.values.length > 0

  return (
    <fieldset className="flex min-w-0 flex-col gap-1" data-slot="filter-rail-group">
      <legend className="mb-1 flex min-h-7 w-full items-center justify-between gap-2 type-label text-fg-title">
        {group.label}
        {clearable && (
          <Button
            aria-label={t('removeFilter', { name: group.label })}
            className="-mr-2 text-action-text"
            onClick={() => group.onChange([])}
            size="xs"
            type="button"
            variant="ghost"
          >
            {t('clear')}
          </Button>
        )}
      </legend>
      <RadioGroup
        aria-label={group.label}
        className="gap-1"
        onValueChange={value => group.onChange([value])}
        value={group.values[0] ?? ''}
      >
        {group.options.map(option => (
          <label className={OPTION_CLASS} htmlFor={`${prefix}${option.value}`} key={option.value}>
            <RadioGroupItem id={`${prefix}${option.value}`} value={option.value} />
            <OptionContent option={option} />
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  )
}

const fold = (value: string) => value.normalize('NFD').replaceAll(/\p{M}/gu, '').toLowerCase()

const matches = (option: FilterRailOption, needle: string) => !needle || fold(option.label).includes(needle)

const visibleOptions = (group: FilterRailGroup, needle: string) => {
  if (!group.searchable) return group.options
  const selected = group.options.filter(option => group.values.includes(option.value))
  const rest = group.options.filter(option => !group.values.includes(option.value) && matches(option, needle))
  return [...selected, ...rest]
}

const MultipleGroup = ({ group }: { group: FilterRailGroup }) => {
  const prefix = useId()
  const [query, setQuery] = useState('')
  const needle = fold(query.trim())
  const options = visibleOptions(group, needle)
  const searchable = group.searchable

  return (
    <fieldset className="flex min-w-0 flex-col gap-1" data-slot="filter-rail-group">
      <legend className="mb-1 flex min-h-7 w-full items-center type-label text-fg-title">{group.label}</legend>
      {searchable && (
        <SearchInput
          aria-label={searchable.placeholder}
          className="w-full"
          onValueChange={setQuery}
          placeholder={searchable.placeholder}
          size="sm"
          value={query}
        />
      )}
      <div
        className={cn(
          'flex min-w-0 flex-col gap-1',
          searchable && 'mt-1 max-h-60 scrollbar-thin overflow-y-auto rounded border px-2'
        )}
      >
        {options.map(option => (
          <label className={OPTION_CLASS} htmlFor={`${prefix}${option.value}`} key={option.value}>
            <Checkbox
              id={`${prefix}${option.value}`}
              checked={group.values.includes(option.value)}
              onCheckedChange={next => group.onChange(toggle(group.values, option.value, next === true))}
            />
            <OptionContent option={option} />
          </label>
        ))}
        {searchable && needle !== '' && !group.options.some(option => matches(option, needle)) && (
          <p className="py-2 text-sm text-muted-foreground">{searchable.emptyLabel}</p>
        )}
      </div>
    </fieldset>
  )
}

const FilterRailGroups = ({ extra, groups }: Pick<FilterRailProps, 'extra' | 'groups'>) => (
  <>
    {groups.map(group =>
      group.selection === undefined || group.selection === 'multiple' ? (
        <MultipleGroup group={group} key={group.id} />
      ) : (
        <SingleGroup group={group} key={group.id} />
      )
    )}
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
        'flex w-68 shrink-0 flex-col gap-4 border-r border-border-subtle bg-surface-muted/40 p-5',
        className
      )}
      data-slot="filter-rail"
    >
      <div className="flex min-h-7 items-center justify-between gap-2">
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
    if (group.selection === 'required') return []
    return group.options.reduce<{ group: FilterRailGroup; label: string; value: string }[]>((list, option) => {
      if (group.values.includes(option.value)) list.push({ group, label: option.label, value: option.value })
      return list
    }, [])
  })

  if (chips.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-2" data-slot="filter-chips">
      {chips.map(({ group, label, value }) => (
        <li key={`${group.id}:${value}`}>
          <button
            aria-label={t('removeFilter', { name: `${group.label}: ${label}` })}
            className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-action-border bg-action-subtle px-3 text-sm font-medium text-action-text transition-colors duration-100 outline-none hover:bg-action-subtle/70 focus-visible:focus-ring"
            onClick={() => group.onChange(group.values.filter(item => item !== value))}
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
