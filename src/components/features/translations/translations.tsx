'use client'

import dynamic from 'next/dynamic'
import { useDeferredValue, useState } from 'react'

import { useTranslations } from 'next-intl'
import { debounce, useQueryStates } from 'nuqs'

import { listMessageOverrides } from '@/actions/translations'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { SearchInput } from '@/components/ui/search'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n'
import { type RawCatalog } from '@/lib/message-validation'
import {
  type OverrideEntry,
  TRANSLATION_STATES,
  type TranslationFilter,
  type TranslationState,
  buildRows,
  countStates,
  filterRows,
  namespacesOf,
} from '@/lib/translation-table'

import { TranslationList } from './translation-list'
import { translationsParsers } from './translations-params'

const TranslationEditor = dynamic(async () => (await import('./translation-editor')).TranslationEditor)

const ALL = 'all'

const SEARCH_DEBOUNCE_MS = 250

export const Translations = ({
  catalogs,
  overrides: initialOverrides,
}: {
  catalogs: Record<string, RawCatalog>
  overrides: OverrideEntry[]
}) => {
  const t = useTranslations('Translations')
  const { localeItems } = useI18n()
  const [overrides, setOverrides] = useState(initialOverrides)
  const [params, setParams] = useQueryStates(translationsParsers, { clearOnDefault: true })
  const [search, setSearch] = useState(params.q)
  const query = useDeferredValue(search)
  const filter: TranslationFilter = params.filter ?? ALL

  const rows = buildRows({ catalogs, defaultLocale: DEFAULT_LOCALE, locales: LOCALES, overrides })
  const filtered = filterRows(rows, { filter, namespace: params.namespace, query })
  const counts = countStates(rows)
  const namespaces = namespacesOf(rows)
  const selected = rows.find(row => row.key === params.key) ?? null
  const filtersActive = Boolean(search || params.filter || params.namespace)
  const locales = localeItems.map(({ label, value }) => ({ label, value }))

  const handleSearch = (value: string) => {
    setSearch(value)
    setParams({ q: value }, { limitUrlUpdates: debounce(SEARCH_DEBOUNCE_MS) })
  }

  const handleClear = () => {
    setSearch('')
    setParams({ filter: null, namespace: null, q: null })
  }

  const handleOpen = (key: string) => setParams({ key })

  const handleChanged = async () => {
    const result = await listMessageOverrides()
    if ('data' in result) setOverrides(result.data)
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          aria-label={t('searchPlaceholder')}
          className="h-8 w-full sm:w-80"
          onValueChange={handleSearch}
          placeholder={t('searchPlaceholder')}
          value={search}
        />
        <Select
          onValueChange={value => setParams({ filter: value === ALL ? null : (value as TranslationState) })}
          value={filter}
        >
          <SelectTrigger aria-label={t('filters.state')} className="h-8 w-auto gap-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('states.all')}</SelectItem>
            {TRANSLATION_STATES.map(state => (
              <SelectItem key={state} value={state}>
                {t('filters.option', { count: counts[state], label: t(`states.${state}`) })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          onValueChange={value => setParams({ namespace: value === ALL ? null : value })}
          value={params.namespace ?? ALL}
        >
          <SelectTrigger aria-label={t('filters.namespace')} className="h-8 w-auto gap-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('filters.allNamespaces')}</SelectItem>
            {namespaces.map(namespace => (
              <SelectItem key={namespace} value={namespace}>
                {namespace}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtersActive && (
          <Button onClick={handleClear} size="sm" variant="ghost">
            {t('clearFilters')}
          </Button>
        )}
        <output aria-live="polite" className="ml-auto text-sm text-muted-foreground">
          {t('count', { count: filtered.length })}
        </output>
      </div>
      {filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LucideIcon name="search-x" />
            </EmptyMedia>
            <EmptyTitle>{t('empty.title')}</EmptyTitle>
            <EmptyDescription>{t('empty.description')}</EmptyDescription>
          </EmptyHeader>
          {filtersActive && (
            <EmptyContent>
              <Button onClick={handleClear} size="sm" variant="outline">
                {t('clearFilters')}
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <TranslationList
          key={`${filter}:${params.namespace ?? ''}:${query}`}
          locales={locales}
          onOpen={handleOpen}
          rows={filtered}
        />
      )}
      {selected && (
        <TranslationEditor onChanged={handleChanged} onClose={() => setParams({ key: null })} row={selected} />
      )}
    </div>
  )
}
