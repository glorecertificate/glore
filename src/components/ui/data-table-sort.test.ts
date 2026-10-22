import { describe, expect, it } from 'vitest'

import {
  type DataTableSort,
  flipSort,
  selectSort,
  sortRows,
  sortableColumns,
  toggleSort,
} from '@/components/ui/data-table-sort'

interface Row {
  date: Date | null
  name: string
  points: number | null
}

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })

const columns = [
  { id: 'name', sortValue: (row: Row) => row.name },
  { id: 'points', sortValue: (row: Row) => row.points },
  { id: 'date', sortValue: (row: Row) => row.date },
  { id: 'actions' },
]

const rows: Row[] = [
  { date: new Date('2026-03-01'), name: 'beta', points: 3 },
  { date: null, name: 'Alpha', points: null },
  { date: new Date('2026-01-01'), name: 'gamma 10', points: 10 },
  { date: new Date('2026-02-01'), name: 'gamma 2', points: 1 },
]

const names = (sort: DataTableSort | null, id: string) =>
  sortRows({ collator, column: columns.find(column => column.id === id), rows, sort }).map(row => row.name)

describe('sortableColumns', () => {
  it('keeps only columns that define a sort value', () => {
    expect(sortableColumns(columns).map(column => column.id)).toEqual(['name', 'points', 'date'])
  })
})

describe('selectSort', () => {
  it('starts ascending on a new column', () => {
    expect(selectSort(null, 'name')).toEqual({ descending: false, id: 'name' })
    expect(selectSort({ descending: true, id: 'points' }, 'name')).toEqual({ descending: false, id: 'name' })
  })

  it('keeps the direction when the same column is chosen again', () => {
    expect(selectSort({ descending: true, id: 'name' }, 'name')).toEqual({ descending: true, id: 'name' })
  })
})

describe('toggleSort', () => {
  it('flips the direction of the active column and resets it on another column', () => {
    expect(toggleSort(null, 'name')).toEqual({ descending: false, id: 'name' })
    expect(toggleSort({ descending: false, id: 'name' }, 'name')).toEqual({ descending: true, id: 'name' })
    expect(toggleSort({ descending: true, id: 'name' }, 'points')).toEqual({ descending: false, id: 'points' })
  })
})

describe('flipSort', () => {
  it('flips the direction and ignores an empty sort', () => {
    expect(flipSort(null)).toBeNull()
    expect(flipSort({ descending: false, id: 'name' })).toEqual({ descending: true, id: 'name' })
  })
})

describe('sortRows', () => {
  it('returns the rows unchanged without a sort or a sortable column', () => {
    expect(sortRows({ collator, column: columns[0], rows, sort: null })).toBe(rows)
    expect(sortRows({ collator, column: columns[3], rows, sort: { descending: false, id: 'actions' } })).toBe(rows)
  })

  it('sorts text with the collator, numerically aware', () => {
    expect(names({ descending: false, id: 'name' }, 'name')).toEqual(['Alpha', 'beta', 'gamma 2', 'gamma 10'])
    expect(names({ descending: true, id: 'name' }, 'name')).toEqual(['gamma 10', 'gamma 2', 'beta', 'Alpha'])
  })

  it('sorts numbers and dates', () => {
    expect(names({ descending: false, id: 'date' }, 'date')).toEqual(['gamma 10', 'gamma 2', 'beta', 'Alpha'])
    expect(names({ descending: true, id: 'points' }, 'points')).toEqual(['gamma 10', 'beta', 'gamma 2', 'Alpha'])
  })

  it('keeps empty values last in both directions', () => {
    expect(names({ descending: false, id: 'points' }, 'points').at(-1)).toBe('Alpha')
    expect(names({ descending: true, id: 'points' }, 'points').at(-1)).toBe('Alpha')
  })

  it('does not mutate the input', () => {
    const copy = [...rows]
    names({ descending: true, id: 'name' }, 'name')
    expect(rows).toEqual(copy)
  })
})
