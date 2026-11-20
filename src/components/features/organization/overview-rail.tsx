'use client'

import { useTranslations } from 'next-intl'

import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { CERTIFICATE_STATUS } from '@/components/features/certificates/status'
import { PIPELINE_STATUSES, type Pipeline } from '@/db/queries/organization-insights'
import { cn } from '@/lib/utils'

import { OverviewAction, OverviewCard } from './overview-card'

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

  return (
    <OverviewCard
      action={
        rows.length > 0 && (
          <OverviewAction href="/organization?tab=certificates">{t('openCertificates')}</OverviewAction>
        )
      }
      className={className}
      slot="certificates-card"
      title={t('certificates')}
    >
      {rows.length === 0 && <p className="text-sm text-muted-foreground">{t('certificatesEmpty')}</p>}
      {rows.length > 0 && (
        <>
          <p className="type-title tabular-nums">
            <span aria-hidden>{total}</span>
            <span className="sr-only">{t('requests', { count: total })}</span>
          </p>
          <span aria-hidden className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-status-track">
            {rows.map(status => (
              <span
                className={cn('h-full', FILLS[CERTIFICATE_STATUS[status].tone])}
                key={status}
                style={{ flexGrow: pipeline[status] }}
              />
            ))}
          </span>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {rows.map(status => (
              <li className="flex items-center justify-between gap-3" key={status}>
                <CertificateStatusBadge status={status} />
                <span className="font-medium tabular-nums">{pipeline[status]}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </OverviewCard>
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
    { count: stats.adminCount, fill: 'bg-chart-1', label: t('admins') },
    { count: stats.representativeCount, fill: 'bg-chart-2', label: t('representatives') },
    { count: stats.tutorCount, fill: 'bg-chart-3', label: t('tutors') },
    { count: stats.volunteerCount, fill: 'bg-chart-4', label: t('volunteers') },
    { count: stats.learnerCount, fill: 'bg-chart-5', label: t('learners') },
  ].filter(({ count }) => count > 0)

  return (
    <OverviewCard
      action={<OverviewAction href="/organization?tab=members">{tRail('manage')}</OverviewAction>}
      className={className}
      slot="members-card"
      title={tRail('members')}
    >
      <p className="type-title tabular-nums">{stats.memberCount}</p>
      {roles.length > 0 && (
        <>
          <span aria-hidden className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-status-track">
            {roles.map(({ count, fill, label }) => (
              <span className={cn('h-full', fill)} key={label} style={{ flexGrow: count }} />
            ))}
          </span>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {roles.map(({ count, fill, label }) => (
              <li className="flex items-center justify-between gap-3" key={label}>
                <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <span aria-hidden className={cn('size-2 shrink-0 rounded-full', fill)} />
                  <span className="truncate">{label}</span>
                </span>
                <span className="font-medium tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </OverviewCard>
  )
}
