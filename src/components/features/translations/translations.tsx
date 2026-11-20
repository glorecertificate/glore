'use client'

import dynamic from 'next/dynamic'
import { useDeferredValue, useState } from 'react'

import { useTranslations } from 'next-intl'
import { debounce, useQueryStates } from 'nuqs'

import { listMessageOverrides } from '@/actions/translations'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { FilterRailChips, FilterRailPanel, type FilterRailProps, FilterRailToolbar } from '@/components/ui/filter-rail'
import { SearchInput } from '@/components/ui/search'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n'
import { type RawCatalog } from '@/lib/message-validation'
import {
  type OverrideEntry,
  TRANSLATION_STATES,
  type TranslationState,
  buildRows,
  countStates,
  filterRows,
  namespacesOf,
} from '@/lib/translation-table'

import { TranslationList } from './translation-list'
import { translationsParsers } from './translations-params'

const TranslationEditor = dynamic(async () => (await import('./translation-editor')).TranslationEditor)

const SEARCH_DEBOUNCE_MS = 250

export const Translations = ({
  catalogs,
  overrides: initialOverrides,
}: {
  catalogs: Record<string, RawCatalog>
  overrides: OverrideEntry[]
}) => {
  const t = useTranslations('Translations')
  const tCommon = useTranslations('Common')
  const { localeItems } = useI18n()
  const [overrides, setOverrides] = useState(initialOverrides)
  const [params, setParams] = useQueryStates(translationsParsers, { clearOnDefault: true })
  const [search, setSearch] = useState(params.q)
  const query = useDeferredValue(search)

  const rows = buildRows({ catalogs, defaultLocale: DEFAULT_LOCALE, locales: LOCALES, overrides })
  const filtered = filterRows(rows, { namespaces: params.namespace, query, states: params.filter })
  const counts = countStates(rows)
  const namespaces = namespacesOf(rows)
  const selected = rows.find(row => row.key === params.key) ?? null
  const filtersActive = Boolean(search || params.filter.length > 0 || params.namespace.length > 0)
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

  const namespaceCounts = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.namespace] = (acc[row.namespace] ?? 0) + 1
    return acc
  }, {})

  const rail: FilterRailProps = {
    groups: [
      {
        id: 'state',
        label: t('filters.state'),
        onChange: values => setParams({ filter: values as TranslationState[] }),
        options: TRANSLATION_STATES.map(state => ({
          count: counts[state],
          label: t(`states.${state}`),
          value: state,
        })),
        values: params.filter,
      },
      {
        id: 'namespace',
        label: t('filters.namespace'),
        onChange: values => setParams({ namespace: values }),
        options: namespaces.map(namespace => ({
          count: namespaceCounts[namespace],
          label: namespace,
          value: namespace,
        })),
        values: params.namespace,
      },
    ],
    onReset: handleClear,
    search: placement => (
      <SearchInput
        aria-label={t('searchPlaceholder')}
        className="w-full"
        onValueChange={handleSearch}
        placeholder={t('searchPlaceholder')}
        size={placement === 'panel' ? 'md' : 'sm'}
        value={search}
      />
    ),
    searchActive: Boolean(search),
  }

  return (
    <Card className="min-w-0 flex-row gap-0 overflow-hidden p-0">
      <FilterRailPanel {...rail} className="max-h-dialog self-start overflow-y-auto max-lg:hidden" />
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
          <FilterRailToolbar {...rail} />
          <output aria-live="polite" className="ml-auto text-sm text-muted-foreground">
            {t('count', { count: filtered.length })}
          </output>
        </div>
        <FilterRailChips groups={rail.groups} />
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
                  {tCommon('clearFilters')}
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <TranslationList
            key={`${params.filter.join(',')}:${params.namespace.join(',')}:${query}`}
            locales={locales}
            onOpen={handleOpen}
            rows={filtered}
          />
        )}
        {selected && (
          <TranslationEditor onChanged={handleChanged} onClose={() => setParams({ key: null })} row={selected} />
        )}
      </div>
    </Card>
  )
}
