'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { AgeBadge } from '@/components/features/certificates/age-badge'
import { type OrgTutor } from '@/components/features/certificates/certificate-reviewer'
import { CertificateRowActions } from '@/components/features/certificates/certificate-row-actions'
import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { ageTone, daysBetween } from '@/components/features/certificates/rules'
import { useI18n } from '@/components/providers/i18n'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatCard } from '@/components/ui/stat-card'
import { type Certificate, type CertificateStatus } from '@/db/queries/certificate'
import { fullName } from '@/lib/utils'

const ALL = 'all'
const NO_REVIEWER = 'none'

const STATUSES = [
  'submitted',
  'in_review',
  'changes_requested',
  'approved',
  'rejected',
  'withdrawn',
  'revoked',
] as const satisfies CertificateStatus[]

const STATUS_LABEL_KEYS = {
  approved: 'statusApproved',
  changes_requested: 'statusChangesRequested',
  in_review: 'statusInReview',
  rejected: 'statusRejected',
  revoked: 'statusRevoked',
  submitted: 'statusSubmitted',
  withdrawn: 'statusWithdrawn',
} as const satisfies Record<(typeof STATUSES)[number], string>

const PIPELINE = ['submitted', 'in_review', 'changes_requested', 'approved'] as const

const holderName = (certificate: Certificate) => (certificate.user ? fullName(certificate.user) : '')

export const OrganizationCertificates = ({
  certificates,
  tutors,
}: {
  certificates: Certificate[]
  tutors: OrgTutor[]
}) => {
  const t = useTranslations('Certificates.org')
  const tCertificates = useTranslations('Certificates')
  const { locale } = useI18n()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState(ALL)
  const [reviewer, setReviewer] = useState(ALL)
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })

  const counts = Object.fromEntries(
    PIPELINE.map(key => [key, certificates.filter(certificate => certificate.status === key).length])
  ) as Record<(typeof PIPELINE)[number], number>
  const closed = certificates.filter(({ isOpen, isApproved }) => !(isOpen || isApproved)).length
  const waiting = certificates.filter(({ isSubmitted, reviewerId }) => isSubmitted && !reviewerId).length

  const needle = query.trim().toLowerCase()
  const rows = certificates.filter(certificate => {
    if (status !== ALL && certificate.status !== status) return false
    if (reviewer === NO_REVIEWER && certificate.reviewerId) return false
    if (reviewer !== ALL && reviewer !== NO_REVIEWER && certificate.reviewerId !== reviewer) return false
    if (!needle) return true
    return [holderName(certificate), certificate.user?.email ?? '', certificate.code ?? ''].some(value =>
      value.toLowerCase().includes(needle)
    )
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          description={t('unassignedCount', { count: waiting })}
          label={tCertificates('statusSubmitted')}
          value={counts.submitted}
        />
        <StatCard label={tCertificates('statusInReview')} value={counts.in_review} />
        <StatCard label={tCertificates('statusChangesRequested')} value={counts.changes_requested} />
        <StatCard
          description={t('closedCount', { count: closed })}
          label={tCertificates('statusApproved')}
          value={counts.approved}
        />
      </div>

      <DataTable
        columns={[
          {
            cell: certificate => (
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">
                  {certificate.isHolderDeleted
                    ? tCertificates('deletedUser')
                    : holderName(certificate) || tCertificates('unknownVolunteer')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {certificate.isHolderDeleted ? t('holderDeleted') : certificate.user?.email}
                </span>
              </div>
            ),
            header: t('volunteer'),
            id: 'volunteer',
            sortValue: holderName,
          },
          {
            cell: certificate => <CertificateStatusBadge status={certificate.status} />,
            header: t('status'),
            id: 'status',
            sortValue: certificate => certificate.status,
          },
          {
            cell: certificate => (
              <span className="text-sm">{certificate.reviewer ? fullName(certificate.reviewer) : t('noReviewer')}</span>
            ),
            header: t('reviewer'),
            id: 'reviewer',
            sortValue: certificate => (certificate.reviewer ? fullName(certificate.reviewer) : ''),
          },
          {
            cell: certificate => {
              if (!certificate.isPending) {
                return (
                  <span className="text-sm text-muted-foreground">
                    {formatter.format(new Date(certificate.updatedAt))}
                  </span>
                )
              }
              const days = daysBetween(certificate.submittedAt ?? certificate.createdAt)
              return <AgeBadge days={days} tone={ageTone(days)} />
            },
            header: t('waiting'),
            id: 'waiting',
            sortValue: certificate => new Date(certificate.submittedAt ?? certificate.createdAt),
          },
        ]}
        emptyDescription={t('emptyDescription')}
        emptyTitle={t('emptyTitle')}
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              aria-label={t('search')}
              className="h-9 w-56"
              onChange={event => setQuery(event.target.value)}
              placeholder={t('search')}
              type="search"
              value={query}
            />
            <Select onValueChange={setStatus} value={status}>
              <SelectTrigger aria-label={t('status')} className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('allStatuses')}</SelectItem>
                {STATUSES.map(key => (
                  <SelectItem key={key} value={key}>
                    {tCertificates(STATUS_LABEL_KEYS[key])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setReviewer} value={reviewer}>
              <SelectTrigger aria-label={t('reviewer')} className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t('allReviewers')}</SelectItem>
                <SelectItem value={NO_REVIEWER}>{t('noReviewer')}</SelectItem>
                {tutors.map(tutor => (
                  <SelectItem key={tutor.id} value={tutor.id}>
                    {fullName(tutor)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        getRowId={certificate => certificate.id}
        label={t('title')}
        rowActions={certificate => <CertificateRowActions certificate={certificate} tutors={tutors} />}
        rows={rows}
      />
    </div>
  )
}
