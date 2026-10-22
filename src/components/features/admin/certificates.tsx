'use client'

import { useState, useTransition } from 'react'

import { useFormatter, useTranslations } from 'next-intl'
import { debounce, useQueryStates } from 'nuqs'

import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { OrganizationCertificatesPanel } from '@/components/features/organization/certificates-panel'
import { Button } from '@/components/ui/button'
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
import { cn, fullName } from '@/lib/utils'

import { AdminCertificateActions } from './certificate-actions'
import { adminCertificatesParsers } from './certificates-params'

const ALL = 'all'
const SEARCH_DEBOUNCE_MS = 300

const STATUS_LABEL_KEYS = {
  approved: 'statusApproved',
  changes_requested: 'statusChangesRequested',
  in_review: 'statusInReview',
  rejected: 'statusRejected',
  revoked: 'statusRevoked',
  submitted: 'statusSubmitted',
  withdrawn: 'statusWithdrawn',
} as const satisfies Record<AdminCertificateStatus, string>

export const AdminCertificates = ({
  organizations,
  page,
}: {
  organizations: { id: number; name: string }[]
  page: AdminCertificatePage | null
}) => {
  const t = useTranslations('Admin.certificates')
  const tCertificates = useTranslations('Certificates')
  const { dateTime } = useFormatter()
  const [pending, startTransition] = useTransition()
  const [params, setParams] = useQueryStates(adminCertificatesParsers, {
    clearOnDefault: true,
    shallow: false,
    startTransition,
  })
  const [search, setSearch] = useState(params.q)
  const scoped = params.org !== null
  const filtersActive = Boolean(params.q || params.status)

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
      <SelectTrigger aria-label={t('filters.organization')} className="h-8 w-auto max-w-56 gap-1.5">
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
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">{organizationSelect}</div>
        <OrganizationCertificatesPanel key={params.org} organizationId={params.org} />
      </div>
    )
  }

  return (
    <DataTable
      className={cn(pending && 'opacity-60 transition-opacity')}
      columns={[
        {
          cell: certificate => <span className="font-mono text-xs">{certificate.code ?? t('codeNone')}</span>,
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
      filters={
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <SearchInput
            aria-label={t('searchPlaceholder')}
            className="h-8 w-full sm:w-80"
            onValueChange={handleSearch}
            placeholder={t('searchPlaceholder')}
            value={search}
          />
          <Select
            onValueChange={value =>
              setParams({ page: 1, status: value === ALL ? null : (value as AdminCertificateStatus) })
            }
            value={params.status ?? ALL}
          >
            <SelectTrigger aria-label={t('filters.status')} className="h-8 w-auto gap-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('filters.allStatuses')}</SelectItem>
              {ADMIN_CERTIFICATE_STATUSES.map(status => (
                <SelectItem key={status} value={status}>
                  {tCertificates(STATUS_LABEL_KEYS[status])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {organizationSelect}
          {filtersActive && (
            <Button onClick={handleClear} size="sm" variant="ghost">
              {t('clearFilters')}
            </Button>
          )}
        </div>
      }
      getRowId={certificate => certificate.id}
      label={t('tableLabel')}
      pageSize={page?.pageSize}
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
