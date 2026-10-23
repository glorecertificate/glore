'use client'

import { useRef } from 'react'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useTranslations } from 'next-intl'

import { type TranslationRow } from '@/lib/translation-table'
import { cn } from '@/lib/utils'

import { TRANSLATION_GRID, TranslationRowItem } from './translation-row'

const ROW_ESTIMATE = 128

const OVERSCAN = 6

export const TranslationList = ({
  locales,
  onOpen,
  rows,
}: {
  locales: { label: string; value: string }[]
  onOpen: (key: string) => void
  rows: TranslationRow[]
}) => {
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
          <thead className="sticky top-0 z-10 hidden bg-muted md:grid">
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
