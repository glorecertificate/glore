'use client'

import { DataTable, type DataTableColumn } from '@/components/ui/data-table'

const noCell = () => null
const noRowId = () => 0

const columnsOf = (headers: string[]): DataTableColumn<never>[] =>
  headers.map((header, index) => ({ cell: noCell, header, id: `column-${index}` }))

export const TableSkeleton = ({
  filters,
  headers,
  label,
}: {
  filters: React.ReactNode
  headers: string[]
  label: string
}) => (
  <DataTable
    columns={columnsOf(headers)}
    emptyDescription=""
    emptyTitle=""
    filters={filters}
    getRowId={noRowId}
    label={label}
    loading
    rowActions={noCell}
    rows={[]}
    skeleton
  />
)
