'use client'

import { useTranslations } from 'next-intl'

import { DataTable } from '@/components/ui/data-table'

type AdminTableNamespace = 'Admin.audit' | 'Admin.certificates' | 'Admin.users'

export const AdminTableSkeleton = ({
  columns,
  namespace,
  pageSize,
  rowActions = false,
}: {
  columns: string[]
  namespace: AdminTableNamespace
  pageSize: number
  rowActions?: boolean
}) => {
  const t = useTranslations(namespace)
  const translate = t as unknown as (key: string) => string

  return (
    <DataTable
      columns={columns.map(id => ({ cell: () => null, header: translate(`columns.${id}`), id }))}
      emptyDescription=""
      emptyTitle=""
      getRowId={() => 0}
      label={translate('tableLabel')}
      loading
      pageSize={pageSize}
      rowActions={rowActions ? () => null : undefined}
      rows={[]}
      skeleton
    />
  )
}
