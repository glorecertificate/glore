'use client'

import { useState } from 'react'

import { useFormatter, useLocale, useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  type DataTableSort,
  type DataTableSortValue,
  flipSort,
  selectSort,
  sortActionKey,
  sortRows,
  sortableColumns,
  toggleSort,
} from '@/components/ui/data-table-sort'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useReveal } from '@/hooks/use-reveal'
import { cn } from '@/lib/utils'

const MOBILE_TABLE = 'max-sm:block'

const MOBILE_HEAD = 'max-sm:sr-only'

const MOBILE_BODY = 'max-sm:block'

const MOBILE_ROW = 'max-sm:relative max-sm:grid max-sm:grid-cols-2 max-sm:gap-x-4 max-sm:gap-y-2 max-sm:p-3'

const MOBILE_CELL = [
  'max-sm:block max-sm:min-w-0 max-sm:p-0 max-sm:whitespace-normal',
  'max-sm:before:mb-0.5 max-sm:before:block max-sm:before:text-xs max-sm:before:text-muted-foreground max-sm:before:content-[attr(data-label)]',
]

const MOBILE_LEAD = 'max-sm:col-span-2 max-sm:before:hidden'

const MOBILE_SELECT = 'w-10 max-sm:absolute max-sm:top-3 max-sm:right-3 max-sm:block max-sm:w-auto max-sm:p-0'

const MOBILE_ACTIONS = 'max-sm:col-span-2 max-sm:text-left'

export interface DataTableColumn<T> {
  cell: (row: T) => React.ReactNode
  className?: string
  header: string
  id: string
  sortValue?: (row: T) => DataTableSortValue
}

export interface DataTablePagination {
  onPageChange: (page: number) => void
  page: number
  pageCount: number
  total: number
}

const SKELETON_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-1/3'] as const

export type DataTableRowId = string | number

export const DataTable = <T,>({
  bulkActions,
  className,
  columns,
  emptyDescription,
  emptyTitle,
  filters,
  getRowId,
  label,
  loading = false,
  onSelectionChange,
  pageSize = 10,
  pageResetKey,
  pagination,
  rowActions,
  rowLabel,
  rows,
  selectable = false,
  selectedIds,
  skeleton = false,
  ...props
}: Omit<React.ComponentProps<'div'>, 'children'> & {
  bulkActions?: (ids: DataTableRowId[]) => React.ReactNode
  columns: DataTableColumn<T>[]
  emptyDescription: string
  emptyTitle: string
  filters?: React.ReactNode
  getRowId: (row: T) => DataTableRowId
  label: string
  loading?: boolean
  onSelectionChange?: (ids: DataTableRowId[]) => void
  pageResetKey?: string
  pageSize?: number
  pagination?: DataTablePagination
  rowActions?: (row: T) => React.ReactNode
  rows: T[]
  selectedIds?: DataTableRowId[]
  skeleton?: boolean
} & ({ rowLabel: (row: T) => string; selectable: true } | { rowLabel?: (row: T) => string; selectable?: false })) => {
  const t = useTranslations('Components.DataTable')
  const locale = useLocale()
  const { number } = useFormatter()
  const [page, setPage] = useState(0)
  const [previousResetKey, setPreviousResetKey] = useState(pageResetKey)
  if (previousResetKey !== pageResetKey) {
    setPreviousResetKey(pageResetKey)
    setPage(0)
  }
  const [sort, setSort] = useState<DataTableSort | null>(null)
  const [ownSelection, setOwnSelection] = useState<DataTableRowId[]>([])
  const reveal = useReveal(loading)
  const column = columns.find(item => item.id === sort?.id)
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' })
  const sorted = sortRows({ collator, column, rows, sort })
  const sortable = sortableColumns(columns)
  const limit = Math.max(1, Math.trunc(pageSize) || 10)
  const pageCount = pagination ? Math.max(1, pagination.pageCount) : Math.max(1, Math.ceil(sorted.length / limit))
  const currentPage = pagination ? Math.min(Math.max(pagination.page, 1), pageCount) - 1 : Math.min(page, pageCount - 1)
  const visible = pagination ? sorted : sorted.slice(currentPage * limit, (currentPage + 1) * limit)
  const total = pagination ? pagination.total : rows.length
  const columnCount = columns.length + (rowActions ? 1 : 0) + (selectable ? 1 : 0)
  const showSkeleton = loading && skeleton
  const storedSelection = selectedIds ?? ownSelection
  const knownIds = pagination ? null : new Set(rows.map(getRowId))
  const selection = knownIds ? storedSelection.filter(id => knownIds.has(id)) : storedSelection
  const pageIds = visible.map(getRowId)
  const pageSelected = pageIds.filter(id => selection.includes(id)).length
  const allSelected = pageIds.length > 0 && pageSelected === pageIds.length
  const hasSelection = selectable && selection.length > 0 && !loading
  const pageChecked = allSelected ? true : pageSelected > 0 ? 'indeterminate' : false

  const select = (ids: DataTableRowId[]) => {
    setOwnSelection(ids)
    onSelectionChange?.(ids)
  }

  const toggleRow = (id: DataTableRowId, checked: boolean) =>
    select(checked ? [...selection.filter(item => item !== id), id] : selection.filter(item => item !== id))

  const togglePage = (checked: boolean) =>
    select(
      checked
        ? [...selection.filter(id => !pageIds.includes(id)), ...pageIds]
        : selection.filter(id => !pageIds.includes(id))
    )

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || selection.length === 0) return
    if (!event.currentTarget.contains(event.target as Node)) return
    select([])
  }

  const goToPage = (index: number) => {
    if (pagination) return pagination.onPageChange(index + 1)
    setPage(index)
  }

  const onToggleSort = (id: string) => {
    setSort(current => toggleSort(current, id))
    setPage(0)
  }

  const onSelectSort = (id: string) => {
    setSort(current => selectSort(current, id))
    setPage(0)
  }

  const onFlipSort = () => {
    setSort(current => flipSort(current))
    setPage(0)
  }

  return (
    <div
      aria-busy={loading}
      className={cn('flex min-w-0 flex-col gap-4 rounded-xl bg-card p-4 shadow-card', className)}
      data-slot="data-table"
      onKeyDown={selectable ? onKeyDown : undefined}
      role={selectable ? 'group' : undefined}
      aria-label={selectable ? label : undefined}
      {...props}
    >
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
        {filters}
        <span aria-live="polite" className="sr-only" role="status">
          {hasSelection ? t('selected', { count: selection.length }) : !loading && t('count', { count: total })}
        </span>
        {hasSelection ? (
          <div
            aria-label={t('bulkActions')}
            className="flex flex-wrap items-center gap-2"
            data-slot="data-table-selection"
            role="toolbar"
          >
            <span className="text-sm font-medium">{t('selected', { count: selection.length })}</span>
            {bulkActions?.(selection)}
            <Button onClick={() => select([])} size="sm" type="button" variant="ghost">
              {t('clearSelection')}
            </Button>
          </div>
        ) : (
          <span aria-hidden className="text-sm text-muted-foreground">
            {!loading && t('count', { count: total })}
          </span>
        )}
      </div>
      {selectable && (
        <label className="flex items-center gap-2 text-sm sm:hidden">
          <Checkbox
            checked={pageChecked}
            disabled={loading || visible.length === 0}
            onCheckedChange={checked => togglePage(checked === true)}
          />
          {t('selectAll')}
        </label>
      )}
      {sortable.length > 0 && (
        <div className="flex items-center gap-2 sm:hidden" data-slot="data-table-sort">
          <Select onValueChange={onSelectSort} value={sort?.id ?? ''}>
            <SelectTrigger aria-label={t('sortBy')} className="min-w-0 flex-1" size="sm">
              <SelectValue placeholder={t('sortBy')} />
            </SelectTrigger>
            <SelectContent>
              {sortable.map(item => (
                <SelectItem key={item.id} value={item.id}>
                  {item.header}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            aria-label={t(sortActionKey(sort))}
            disabled={!sort}
            onClick={onFlipSort}
            size="icon"
            type="button"
            variant="outline"
          >
            <LucideIcon name={sort?.descending ? 'arrow-down' : 'arrow-up'} />
          </Button>
        </div>
      )}
      <div className="overflow-hidden rounded-lg border">
        <Table aria-label={label} className={MOBILE_TABLE}>
          {(!loading || showSkeleton) && (
            <TableHeader className={MOBILE_HEAD}>
              <TableRow>
                {selectable && (
                  <TableHead className="w-10 max-sm:hidden" scope="col">
                    <Checkbox
                      aria-label={t('selectAll')}
                      checked={pageChecked}
                      disabled={loading || visible.length === 0}
                      onCheckedChange={checked => togglePage(checked === true)}
                    />
                  </TableHead>
                )}
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
                        className="-ml-2 text-muted-foreground hover:text-foreground"
                        disabled={loading}
                        onClick={() => onToggleSort(item.id)}
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
          )}
          <TableBody className={cn(MOBILE_BODY, reveal && 'animate-reveal')}>
            {showSkeleton ? (
              Array.from({ length: limit }, (_, index) => (
                <TableRow aria-hidden className={MOBILE_ROW} key={index}>
                  {selectable && (
                    <TableCell className={MOBILE_SELECT}>
                      <Skeleton className="size-4" />
                    </TableCell>
                  )}
                  {columns.map((item, position) => (
                    <TableCell
                      className={cn(
                        MOBILE_CELL,
                        position === 0 && cn(MOBILE_LEAD, selectable && 'max-sm:pr-8'),
                        item.className
                      )}
                      data-label={item.header}
                      key={item.id}
                    >
                      <Skeleton className={cn('h-5', SKELETON_WIDTHS[(index + position) % SKELETON_WIDTHS.length])} />
                    </TableCell>
                  ))}
                  {rowActions && (
                    <TableCell className={cn(MOBILE_CELL, MOBILE_ACTIONS)}>
                      <Skeleton className="ml-auto h-5 w-8 max-sm:ml-0" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : loading ? (
              <TableRow className="max-sm:block">
                <TableCell className="max-sm:block" colSpan={columnCount}>
                  <Empty className="cursor-wait">
                    <Spinner aria-hidden size="lg" variant="colored" />
                  </Empty>
                </TableCell>
              </TableRow>
            ) : visible.length > 0 ? (
              visible.map(row => (
                <TableRow
                  className={MOBILE_ROW}
                  data-state={selectable && selection.includes(getRowId(row)) ? 'selected' : undefined}
                  key={getRowId(row)}
                >
                  {selectable && (
                    <TableCell className={MOBILE_SELECT}>
                      <Checkbox
                        aria-label={rowLabel?.(row) ?? t('selectRow')}
                        checked={selection.includes(getRowId(row))}
                        onCheckedChange={checked => toggleRow(getRowId(row), checked === true)}
                      />
                    </TableCell>
                  )}
                  {columns.map((item, position) => (
                    <TableCell
                      className={cn(
                        MOBILE_CELL,
                        position === 0 && cn(MOBILE_LEAD, selectable && 'max-sm:pr-8'),
                        item.className
                      )}
                      data-label={item.header}
                      key={item.id}
                    >
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
