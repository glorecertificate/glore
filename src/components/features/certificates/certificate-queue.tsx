'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { selfAssignCertificate } from '@/actions/certificates/assignment'
import { AgeBadge } from '@/components/features/certificates/age-badge'
import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { type TutorQueueTab } from '@/components/features/certificates/params'
import { ageTone, daysBetween } from '@/components/features/certificates/rules'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Link } from '@/components/ui/link'
import { type Certificate } from '@/db/queries/certificate'
import { fullName } from '@/lib/utils'

export const certificateAge = (certificate: Certificate) =>
  daysBetween(certificate.submittedAt ?? certificate.createdAt)

export const CertificateQueue = ({
  filters,
  rows,
  tab,
}: {
  filters: React.ReactNode
  rows: Certificate[]
  tab: TutorQueueTab
}) => {
  const t = useTranslations('Certificates.queue')
  const { refresh } = useRouter()
  const { locale } = useI18n()
  const [pending, startTransition] = useTransition()
  const formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })

  const claim = (id: number) =>
    startTransition(async () => {
      const { error } = await selfAssignCertificate(id)
      if (error) return void toast.error(t('claimError'))
      toast.success(t('claimSuccess'))
      return refresh()
    })

  return (
    <DataTable
      columns={[
        {
          cell: certificate => (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">
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
      emptyDescription={t(`empty.${tab}.description`)}
      emptyTitle={t(`empty.${tab}.title`)}
      filters={filters}
      getRowId={certificate => certificate.id}
      label={t(`tabs.${tab}`)}
      rowActions={certificate => {
        if (tab === 'pool') {
          return (
            <Button
              disabled={pending}
              icon="user-plus"
              onClick={() => claim(certificate.id)}
              size="sm"
              variant="outline"
            >
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
      rows={rows}
    />
  )
}
