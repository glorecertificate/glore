'use client'

import { useTranslations } from 'next-intl'

import { AgeBadge } from '@/components/features/certificates/age-badge'
import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { type TutorQueueTab } from '@/components/features/certificates/params'
import { ageTone, daysBetween } from '@/components/features/certificates/rules'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { type FilterRailProps } from '@/components/ui/filter-rail'
import { Link } from '@/components/ui/link'
import { type Certificate } from '@/db/queries/certificate'
import { fullName } from '@/lib/utils'

export const certificateAge = (certificate: Certificate) =>
  daysBetween(certificate.submittedAt ?? certificate.createdAt)

export const CertificateQueue = ({
  filtered,
  claiming,
  onClaim,
  onSelectionChange,
  rail,
  rows,
  selectedIds,
  tab,
}: {
  claiming: boolean
  filtered: boolean
  onClaim: (ids: number[]) => void
  onSelectionChange: (ids: number[]) => void
  rail: FilterRailProps
  rows: Certificate[]
  selectedIds: number[]
  tab: TutorQueueTab
}) => {
  const t = useTranslations('CertificateQueue')
  const { locale } = useI18n()
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })

  const selectable = tab === 'pool'

  return (
    <DataTable
      bulkActions={ids => (
        <Button
          disabled={claiming}
          icon="user-plus"
          loading={claiming}
          onClick={() => onClaim(ids.map(Number))}
          size="sm"
          variant="outline"
        >
          {t('claimSelected', { count: ids.length })}
        </Button>
      )}
      columns={[
        {
          cell: certificate => (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-foreground">
                {certificate.user ? fullName(certificate.user) : t('unknownVolunteer')}
              </span>
              <span className="text-xs text-muted-foreground">{certificate.organization.name}</span>
            </div>
          ),
          header: t('volunteer'),
          id: 'volunteer',
          sortValue: certificate => (certificate.user ? fullName(certificate.user) : ''),
        },
        {
          cell: certificate => <CertificateStatusBadge status={certificate.status} />,
          header: t('status'),
          id: 'status',
          sortValue: certificate => certificate.status,
        },
        {
          cell: certificate => {
            if (!certificate.isPending) {
              return (
                <span className="text-sm text-muted-foreground">
                  {certificate.isChangesRequested ? t('waitingVolunteer') : t('notApplicable')}
                </span>
              )
            }
            const days = certificateAge(certificate)
            return <AgeBadge days={days} tone={ageTone(days)} />
          },
          header: t('ageColumn'),
          id: 'age',
          sortValue: certificate => (certificate.isPending ? certificateAge(certificate) : -1),
        },
        {
          cell: certificate => (
            <time className="text-sm text-muted-foreground" dateTime={certificate.submittedAt ?? certificate.createdAt}>
              {formatter.format(new Date(certificate.submittedAt ?? certificate.createdAt))}
            </time>
          ),
          header: t('submitted'),
          id: 'submitted',
          sortValue: certificate => new Date(certificate.submittedAt ?? certificate.createdAt),
        },
      ]}
      emptyDescription={filtered ? t('emptyFiltered.description') : t(`empty.${tab}.description`)}
      emptyTitle={filtered ? t('emptyFiltered.title') : t(`empty.${tab}.title`)}
      getRowId={certificate => certificate.id}
      label={t(`tabs.${tab}`)}
      onSelectionChange={ids => onSelectionChange(ids.map(Number))}
      rail={rail}
      rowActions={certificate => {
        if (tab === 'pool') {
          return (
            <Button icon="user-plus" onClick={() => onClaim([certificate.id])} size="sm" variant="outline">
              {t('claim')}
            </Button>
          )
        }
        const reviewable = certificate.isSubmitted || certificate.isInReview
        return (
          <Button
            asChild
            icon={reviewable ? 'clipboard-check' : 'eye'}
            size="sm"
            variant={reviewable ? 'brand' : 'outline'}
          >
            <Link href={reviewable ? `/certificates/${certificate.id}/review` : `/certificates/${certificate.id}`}>
              {reviewable ? t('review') : t('view')}
            </Link>
          </Button>
        )
      }}
      rowLabel={certificate => (certificate.user ? fullName(certificate.user) : t('unknownVolunteer'))}
      rows={rows}
      selectable={selectable}
      selectedIds={selectedIds}
    />
  )
}
