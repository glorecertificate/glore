'use client'

import { useState, useTransition } from 'react'

import { useFormatter, useTranslations } from 'next-intl'
import { debounce, useQueryStates } from 'nuqs'

import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { CERTIFICATE_STATUS } from '@/components/features/certificates/status'
import { OrganizationCertificatesPanel } from '@/components/features/organization/certificates-panel'
import { Card } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Link } from '@/components/ui/link'
import { SearchInput } from '@/components/ui/search'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ADMIN_CERTIFICATE_STATUSES,
  type AdminCertificatePage,
  type AdminCertificateStatus,
} from '@/db/queries/admin-certificate'
import { timestampMillis } from '@/db/queries/organization'
import { fullName } from '@/lib/utils'

import { AdminCertificateActions } from './certificate-actions'
import { adminCertificatesParsers } from './certificates-params'

const ALL = 'all'
const SEARCH_DEBOUNCE_MS = 300

export const AdminCertificates = ({
  organizations,
  page,
}: {
  organizations: { id: number; name: string }[]
  page: AdminCertificatePage | null
}) => {
  const t = useTranslations('Admin.certificates')
  const tCertificates = useTranslations('CertificateStatus')
  const { dateTime } = useFormatter()
  const [pending, startTransition] = useTransition()
  const [params, setParams] = useQueryStates(adminCertificatesParsers, {
    clearOnDefault: true,
    shallow: false,
    startTransition,
  })
  const [search, setSearch] = useState(params.q)
  const scoped = params.org !== null
  const filtersActive = Boolean(params.q || params.status.length > 0)

  const handleSearch = (value: string) => {
    setSearch(value)
    setParams({ page: 1, q: value }, { limitUrlUpdates: debounce(SEARCH_DEBOUNCE_MS) })
  }

  const handleClear = () => {
    setSearch('')
    setParams({ page: 1, q: null, status: null })
  }

  const organizationSelect = (
    <Select
      onValueChange={value => setParams({ org: value === ALL ? null : Number(value), page: 1, q: null, status: null })}
      value={scoped ? String(params.org) : ALL}
    >
      <SelectTrigger aria-label={t('filters.organization')} className="w-full" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{t('filters.allOrganizations')}</SelectItem>
        {organizations.map(organization => (
          <SelectItem key={organization.id} value={String(organization.id)}>
            {organization.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  if (scoped && params.org !== null) {
    return (
      <Card className="gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">{organizationSelect}</div>
        <OrganizationCertificatesPanel key={params.org} organizationId={params.org} />
      </Card>
    )
  }

  return (
    <DataTable
      tabIndex={-1}
      className="outline-none"
      refreshing={pending}
      columns={[
        {
          cell: certificate =>
            certificate.code ? (
              <Link className="font-mono text-xs hover:underline" href={`/certificates/${certificate.id}`}>
                {certificate.code}
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground">{t('codeNone')}</span>
            ),
          header: t('columns.code'),
          id: 'code',
        },
        {
          cell: certificate => (
            <div className="flex min-w-0 flex-col">
              <span
                className="truncate font-medium"
                title={fullName(certificate.holder) || certificate.holder.email || undefined}
              >
                {fullName(certificate.holder) || certificate.holder.email}
              </span>
              <span className="truncate text-xs text-muted-foreground" title={certificate.holder.email ?? undefined}>
                {certificate.holder.email ?? t('holderDeleted')}
              </span>
            </div>
          ),
          className: 'max-w-48 max-sm:max-w-none',
          header: t('columns.holder'),
          id: 'holder',
        },
        {
          cell: certificate => (
            <Link
              className="hover:underline"
              href={`/admin/certificates?org=${certificate.organization.id}`}
              title={t('openOrganization', { name: certificate.organization.name })}
            >
              {certificate.organization.name}
            </Link>
          ),
          className: 'max-w-40 whitespace-normal max-sm:max-w-none',
          header: t('columns.organization'),
          id: 'organization',
        },
        {
          cell: certificate => <CertificateStatusBadge status={certificate.status} />,
          header: t('columns.status'),
          id: 'status',
        },
        {
          cell: certificate => {
            const date = certificate.issuedAt ?? certificate.submittedAt
            return date ? dateTime(new Date(timestampMillis(date)), { dateStyle: 'medium' }) : null
          },
          header: t('columns.date'),
          id: 'date',
        },
      ]}
      emptyDescription={filtersActive ? t('noResultsDescription') : t('noCertificatesDescription')}
      emptyTitle={filtersActive ? t('noResults') : t('noCertificates')}
      getRowId={certificate => certificate.id}
      label={t('tableLabel')}
      pageSize={page?.pageSize}
      rail={{
        extra: (
          <div className="flex min-w-0 flex-col gap-2">
            <span className="type-label text-fg-title">{t('filters.organization')}</span>
            {organizationSelect}
          </div>
        ),
        groups: [
          {
            id: 'status',
            label: t('filters.status'),
            onChange: values => setParams({ page: 1, status: values as AdminCertificateStatus[] }),
            options: ADMIN_CERTIFICATE_STATUSES.map(status => ({
              count: page?.facets.status?.[status] ?? 0,
              label: tCertificates(CERTIFICATE_STATUS[status].labelKey),
              tone: CERTIFICATE_STATUS[status].tone,
              value: status,
            })),
            values: params.status,
          },
        ],
        onReset: handleClear,
        search: placement => (
          <SearchInput
            aria-label={t('searchPlaceholder')}
            className="w-full"
            hotkey={placement === 'panel' ? '/' : undefined}
            onValueChange={handleSearch}
            placeholder={t('searchPlaceholder')}
            value={search}
          />
        ),
        searchActive: search.length > 0,
      }}
      pagination={
        page
          ? {
              onPageChange: next => setParams({ page: next }),
              page: page.page,
              pageCount: page.pageCount,
              total: page.total,
            }
          : undefined
      }
      rowActions={certificate => <AdminCertificateActions certificate={certificate} />}
      rows={page?.rows ?? []}
    />
  )
}
