'use client'

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'

import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual'
import { useTranslations } from 'next-intl'

import { type TranslationRow } from '@/lib/translation-table'
import { cn } from '@/lib/utils'

import { TRANSLATION_GRID, TranslationRowItem } from './translation-row'

const ROW_ESTIMATE = 128

const OVERSCAN = 6

const WIDE_QUERY = '(min-width: 768px)'

const subscribeWide = (onChange: () => void) => {
  const query = window.matchMedia(WIDE_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

const useWide = () =>
  useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => false
  )

interface TranslationListProps {
  locales: { label: string; value: string }[]
  onOpen: (key: string) => void
  rows: TranslationRow[]
}

const TranslationHead = ({ locales }: Pick<TranslationListProps, 'locales'>) => {
  const t = useTranslations('Translations')

  return (
    <thead className="sticky top-0 z-10 hidden bg-surface-muted md:grid">
      <tr className={cn('grid gap-4 border-b p-3 text-xs font-medium text-muted-foreground', TRANSLATION_GRID)}>
        <th className="text-left font-medium" scope="col">
          {t('columns.key')}
        </th>
        {locales.map(({ label, value }) => (
          <th className="text-left font-medium" key={value} scope="col">
            {label}
          </th>
        ))}
      </tr>
    </thead>
  )
}

const TranslationListScroller = ({ locales, onOpen, rows }: TranslationListProps) => {
  const t = useTranslations('Translations')
  const scrollRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => ROW_ESTIMATE,
    getScrollElement: () => scrollRef.current,
    overscan: OVERSCAN,
  })

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="h-[calc(100dvh-17rem)] min-h-96 overflow-auto" ref={scrollRef}>
        <table aria-label={t('tableLabel')} aria-rowcount={rows.length + 1} className="grid w-full">
          <TranslationHead locales={locales} />
          <tbody className="relative grid" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {virtualizer.getVirtualItems().map(item => {
              const row = rows[item.index]
              if (!row) return null
              return (
                <TranslationRowItem
                  aria-rowindex={item.index + 2}
                  className="absolute top-0 left-0 w-full"
                  data-index={item.index}
                  key={row.key}
                  locales={locales}
                  onOpen={onOpen}
                  ref={virtualizer.measureElement}
                  row={row}
                  style={{ transform: `translateY(${item.start}px)` }}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const TranslationListPage = ({ locales, onOpen, rows }: TranslationListProps) => {
  'use no memo'

  const t = useTranslations('Translations')
  const listRef = useRef<HTMLDivElement>(null)
  const [margin, setMargin] = useState(0)
  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => ROW_ESTIMATE,
    overscan: OVERSCAN,
    scrollMargin: margin,
  })

  useLayoutEffect(() => {
    const measure = () => {
      if (!listRef.current) return
      setMargin(Math.round(listRef.current.getBoundingClientRect().top + window.scrollY))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="overflow-hidden rounded-lg border" ref={listRef}>
      <table aria-label={t('tableLabel')} aria-rowcount={rows.length + 1} className="grid w-full">
        <tbody className="relative grid" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          {virtualizer.getVirtualItems().map(item => {
            const row = rows[item.index]
            if (!row) return null
            return (
              <TranslationRowItem
                aria-rowindex={item.index + 2}
                className="absolute top-0 left-0 w-full"
                data-index={item.index}
                key={row.key}
                locales={locales}
                onOpen={onOpen}
                ref={virtualizer.measureElement}
                row={row}
                style={{ transform: `translateY(${item.start - margin}px)` }}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export const TranslationList = (props: TranslationListProps) => {
  const wide = useWide()
  return wide ? <TranslationListScroller {...props} /> : <TranslationListPage {...props} />
}
