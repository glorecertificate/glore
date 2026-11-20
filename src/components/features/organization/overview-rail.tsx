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
    { count: stats.adminCount, label: t('admins') },
    { count: stats.representativeCount, label: t('representatives') },
    { count: stats.tutorCount, label: t('tutors') },
    { count: stats.volunteerCount, label: t('volunteers') },
    { count: stats.learnerCount, label: t('learners') },
  ].filter(({ count }) => count > 0)

  return (
    <OverviewCard
      action={<OverviewAction href="/organization?tab=members">{tRail('manage')}</OverviewAction>}
      className={cn('flex-1', className)}
      slot="members-card"
      title={tRail('members')}
    >
      <p className="type-title tabular-nums">{stats.memberCount}</p>
      <ul className="flex flex-1 flex-col justify-between gap-2 text-sm">
        {roles.map(({ count, label }) => (
          <li className="flex items-center justify-between gap-3" key={label}>
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium tabular-nums">{count}</span>
          </li>
        ))}
      </ul>
    </OverviewCard>
  )
}
