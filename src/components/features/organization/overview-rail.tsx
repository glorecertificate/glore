'use client'

import { useTranslations } from 'next-intl'

import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { CERTIFICATE_STATUS } from '@/components/features/certificates/status'
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { PIPELINE_STATUSES, type Pipeline } from '@/db/queries/organization-insights'
import { cn } from '@/lib/utils'

const FILLS = {
  approved: 'bg-status-approved',
  changes: 'bg-status-changes',
  draft: 'bg-status-draft',
  rejected: 'bg-status-rejected',
  review: 'bg-status-review',
  revoked: 'bg-status-revoked',
  submitted: 'bg-status-submitted',
  withdrawn: 'bg-status-withdrawn',
} as const

export const OrganizationCertificatesCard = ({ className, pipeline }: { className?: string; pipeline: Pipeline }) => {
  const t = useTranslations('OrganizationRail')
  const rows = PIPELINE_STATUSES.filter(status => pipeline[status] > 0)
  const total = rows.reduce((sum, status) => sum + pipeline[status], 0)
  const peak = Math.max(1, ...rows.map(status => pipeline[status]))

  return (
    <Card className={className} data-slot="certificates-card">
      <CardHeader>
        <CardTitle>{t('certificates')}</CardTitle>
        <CardAction className="type-caption text-fg-2">{t('requests', { count: total })}</CardAction>
      </CardHeader>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">{t('certificatesEmpty')}</p>}
      {rows.length > 0 && (
        <ul className="flex flex-col gap-3.5">
          {rows.map(status => (
            <li className="flex flex-col gap-1.5" key={status}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <CertificateStatusBadge status={status} />
                <span className="font-medium tabular-nums">{pipeline[status]}</span>
              </div>
              <span aria-hidden className="block h-1.5 overflow-hidden rounded-full bg-status-track">
                <span
                  className={cn('block h-full rounded-full', FILLS[CERTIFICATE_STATUS[status].tone])}
                  style={{ width: `${(pipeline[status] / peak) * 100}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
      {rows.length > 0 && (
        <Link
          className="inline-flex min-h-8 items-center text-sm font-medium"
          href="/organization?tab=certificates"
          variant="primary"
        >
          {t('openCertificates')}
        </Link>
      )}
    </Card>
  )
}

export const OrganizationMembersCard = ({
  className,
  stats,
}: {
  className?: string
  stats: {
    adminCount: number
    learnerCount: number
    memberCount: number
    representativeCount: number
    tutorCount: number
    volunteerCount: number
  }
}) => {
  const t = useTranslations('Organization')
  const tRail = useTranslations('OrganizationRail')
  const roles = [
    { count: stats.adminCount, label: t('admins') },
    { count: stats.representativeCount, label: t('representatives') },
    { count: stats.tutorCount, label: t('tutors') },
    { count: stats.volunteerCount, label: t('volunteers') },
    { count: stats.learnerCount, label: t('learners') },
  ].filter(({ count }) => count > 0)

  return (
    <Card className={className} data-slot="members-card">
      <CardHeader>
        <CardTitle>{tRail('members')}</CardTitle>
        <CardAction>
          <Link
            className="inline-flex min-h-8 items-center text-sm font-medium"
            href="/organization?tab=members"
            variant="primary"
          >
            {tRail('manage')}
          </Link>
        </CardAction>
      </CardHeader>
      <p className="type-title tabular-nums">{stats.memberCount}</p>
      <ul className="flex flex-col divide-y divide-border-subtle text-sm">
        {roles.map(({ count, label }) => (
          <li className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0" key={label}>
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium tabular-nums">{count}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
