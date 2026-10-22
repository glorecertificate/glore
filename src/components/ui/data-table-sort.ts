export interface DataTableSort {
  descending: boolean
  id: string
}

export type DataTableSortValue = string | number | Date | null

export interface DataTableSortable<T> {
  id: string
  sortValue?: (row: T) => DataTableSortValue
}

export const toggleSort = (current: DataTableSort | null, id: string): DataTableSort => ({
  descending: current?.id === id ? !current.descending : false,
  id,
})

export const selectSort = (current: DataTableSort | null, id: string): DataTableSort => ({
  descending: current?.id === id ? current.descending : false,
  id,
})

export const flipSort = (current: DataTableSort | null): DataTableSort | null =>
  current ? { descending: !current.descending, id: current.id } : null

export const sortActionKey = (current: DataTableSort | null) =>
  current && !current.descending ? 'sortDescending' : 'sortAscending'

export const sortableColumns = <C extends { sortValue?: unknown }>(columns: C[]) =>
  columns.filter(column => column.sortValue)

export const compareSortValues = (left: DataTableSortValue, right: DataTableSortValue, collator: Intl.Collator) => {
  if (left === null) return right === null ? 0 : 1
  if (right === null) return -1
  if (typeof left === 'number' && typeof right === 'number') return left - right
  if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime()
  return collator.compare(String(left), String(right))
}

export const sortRows = <T>({
  collator,
  column,
  rows,
  sort,
}: {
  collator: Intl.Collator
  column: DataTableSortable<T> | undefined
  rows: T[]
  sort: DataTableSort | null
}) => {
  const sortValue = column?.sortValue
  if (!(sortValue && sort)) return rows
  return rows.toSorted((left, right) => {
    const a = sortValue(left)
    const b = sortValue(right)
    if (a === null || b === null) return compareSortValues(a, b, collator)
    const comparison = compareSortValues(a, b, collator)
    return sort.descending ? -comparison : comparison
  })
}
