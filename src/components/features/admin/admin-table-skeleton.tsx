'use client'

import { useTranslations } from 'next-intl'

import { DataTable } from '@/components/ui/data-table'

const PAGE_SIZES = { audit: 25, certificates: 20, users: 20 } as const

export const AdminTableSkeleton = ({ kind }: { kind: keyof typeof PAGE_SIZES }) => {
  const t = useTranslations()

  const tables = {
    audit: {
      columns: [
        { header: t('Admin.audit.columns.date'), id: 'date' },
        { header: t('Admin.audit.columns.category'), id: 'category' },
        { header: t('Admin.audit.columns.event'), id: 'event' },
        { header: t('Admin.audit.columns.organization'), id: 'organization' },
        { header: t('Admin.audit.columns.details'), id: 'details' },
      ],
      label: t('Admin.audit.tableLabel'),
    },
    certificates: {
      columns: [
        { header: t('Admin.certificates.columns.code'), id: 'code' },
        { header: t('Admin.certificates.columns.holder'), id: 'holder' },
        { header: t('Admin.certificates.columns.organization'), id: 'organization' },
        { header: t('Admin.certificates.columns.status'), id: 'status' },
        { header: t('Admin.certificates.columns.date'), id: 'date' },
      ],
      label: t('Admin.certificates.tableLabel'),
    },
    users: {
      columns: [
        { header: t('Admin.users.columns.user'), id: 'user' },
        { header: t('Admin.users.columns.role'), id: 'role' },
        { header: t('Admin.users.columns.status'), id: 'status' },
        { header: t('Admin.users.columns.organizations'), id: 'organizations' },
        { header: t('Admin.users.columns.joined'), id: 'joined' },
      ],
      label: t('Admin.users.tableLabel'),
    },
  }

  const { columns, label } = tables[kind]

  return (
    <DataTable
      columns={columns.map(column => ({ ...column, cell: () => null }))}
      emptyDescription=""
      emptyTitle=""
      getRowId={() => 0}
      label={label}
      loading
      pageSize={PAGE_SIZES[kind]}
      rowActions={kind === 'audit' ? undefined : () => null}
      rows={[]}
      skeleton
    />
  )
}
