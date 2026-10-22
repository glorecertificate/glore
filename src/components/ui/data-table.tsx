'use client'

import { useState } from 'react'

import { useFormatter, useLocale, useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const MOBILE_TABLE = 'max-sm:block'

const MOBILE_HEAD = 'max-sm:sr-only'

const MOBILE_BODY = 'max-sm:block'

const MOBILE_ROW = 'max-sm:grid max-sm:grid-cols-2 max-sm:gap-x-4 max-sm:gap-y-2 max-sm:p-3'

const MOBILE_CELL = [
  'max-sm:block max-sm:min-w-0 max-sm:p-0 max-sm:whitespace-normal',
  'max-sm:before:mb-0.5 max-sm:before:block max-sm:before:text-xs max-sm:before:text-muted-foreground max-sm:before:content-[attr(data-label)]',
  'max-sm:first:col-span-2 max-sm:first:before:hidden',
]

const MOBILE_ACTIONS = 'max-sm:col-span-2 max-sm:text-left'

export interface DataTableColumn<T> {
  cell: (row: T) => React.ReactNode
  className?: string
  header: string
  id: string
  sortValue?: (row: T) => string | number | Date | null
}

export interface DataTablePagination {
  onPageChange: (page: number) => void
  page: number
  pageCount: number
  total: number
}

export const DataTable = <T,>({
  className,
  columns,
  emptyDescription,
  emptyTitle,
  filters,
  getRowId,
  label,
  loading = false,
  pageSize = 10,
  pagination,
  rowActions,
  rows,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  columns: DataTableColumn<T>[]
  emptyDescription: string
  emptyTitle: string
  filters?: React.ReactNode
  getRowId: (row: T) => string | number
  label: string
  loading?: boolean
  pageSize?: number
  pagination?: DataTablePagination
  rowActions?: (row: T) => React.ReactNode
  rows: T[]
}) => {
  const t = useTranslations('Components.DataTable')
  const locale = useLocale()
  const { number } = useFormatter()
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<{ id: string; descending: boolean } | null>(null)
  const column = columns.find(item => item.id === sort?.id)
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' })
  const sorted = column?.sortValue
    ? rows.toSorted((left, right) => {
        const a = column.sortValue?.(left) ?? null
        const b = column.sortValue?.(right) ?? null
        if (a === null) return b === null ? 0 : 1
        if (b === null) return -1
        const comparison =
          typeof a === 'number' && typeof b === 'number'
            ? a - b
            : a instanceof Date && b instanceof Date
              ? a.getTime() - b.getTime()
              : collator.compare(String(a), String(b))
        return sort?.descending ? -comparison : comparison
      })
    : rows
  const limit = Math.max(1, Math.trunc(pageSize) || 10)
  const pageCount = pagination ? Math.max(1, pagination.pageCount) : Math.max(1, Math.ceil(sorted.length / limit))
  const currentPage = pagination ? Math.min(Math.max(pagination.page, 1), pageCount) - 1 : Math.min(page, pageCount - 1)
  const visible = pagination ? sorted : sorted.slice(currentPage * limit, (currentPage + 1) * limit)
  const total = pagination ? pagination.total : rows.length
  const columnCount = columns.length + (rowActions ? 1 : 0)

  const goToPage = (index: number) => {
    if (pagination) return pagination.onPageChange(index + 1)
    setPage(index)
  }

  const toggleSort = (id: string) => {
    setSort(current => ({ id, descending: current?.id === id ? !current.descending : false }))
    setPage(0)
  }

  return (
    <div aria-busy={loading} className={cn('flex min-w-0 flex-col gap-4', className)} data-slot="data-table" {...props}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {filters}
        <span aria-live="polite" className="text-sm text-muted-foreground" role="status">
          {t('count', { count: total })}
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table aria-label={label} className={MOBILE_TABLE}>
          <TableHeader className={MOBILE_HEAD}>
            <TableRow>
              {columns.map(item => (
                <TableHead
                  aria-sort={
                    item.sortValue
                      ? sort?.id === item.id
                        ? sort.descending
                          ? 'descending'
                          : 'ascending'
                        : 'none'
                      : undefined
                  }
                  className={item.className}
                  key={item.id}
                  scope="col"
                >
                  {item.sortValue ? (
                    <Button
                      className="-ml-2"
                      onClick={() => toggleSort(item.id)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      {item.header}
                      <LucideIcon
                        name={sort?.id === item.id ? (sort.descending ? 'arrow-down' : 'arrow-up') : 'arrow-up-down'}
                      />
                    </Button>
                  ) : (
                    item.header
                  )}
                </TableHead>
              ))}
              {rowActions && (
                <TableHead scope="col">
                  <span className="sr-only">{t('actions')}</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className={MOBILE_BODY}>
            {loading ? (
              Array.from({ length: Math.min(limit, 5) }, (_, row) => (
                <TableRow className={MOBILE_ROW} key={row}>
                  {Array.from({ length: columnCount }, (_cell, cell) => (
                    <TableCell className={cn(MOBILE_CELL)} key={cell}>
                      <Skeleton className="h-5 w-full min-w-16" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : visible.length > 0 ? (
              visible.map(row => (
                <TableRow className={MOBILE_ROW} key={getRowId(row)}>
                  {columns.map(item => (
                    <TableCell className={cn(MOBILE_CELL, item.className)} data-label={item.header} key={item.id}>
                      {item.cell(row)}
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell className={cn(MOBILE_CELL, 'text-right', MOBILE_ACTIONS)}>{rowActions(row)}</TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow className="max-sm:block">
                <TableCell className="max-sm:block" colSpan={columnCount}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>{emptyTitle}</EmptyTitle>
                      <EmptyDescription>{emptyDescription}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-muted-foreground" role="status">
          {loading ? t('loading') : t('page', { page: number(currentPage + 1), total: number(pageCount) })}
        </p>
        <div className="flex gap-2">
          <Button
            disabled={loading || currentPage === 0}
            onClick={() => goToPage(currentPage - 1)}
            size="sm"
            type="button"
            variant="outline"
          >
            <LucideIcon name="chevron-left" />
            {t('previous')}
          </Button>
          <Button
            disabled={loading || currentPage >= pageCount - 1}
            onClick={() => goToPage(currentPage + 1)}
            size="sm"
            type="button"
            variant="outline"
          >
            {t('next')}
            <LucideIcon name="chevron-right" />
          </Button>
        </div>
      </div>
    </div>
  )
}
