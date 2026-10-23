'use client'

import { useTranslations } from 'next-intl'

import { CertificatePreview } from '@/components/features/certificates/certificate-preview'
import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { formatActivityPeriod } from '@/components/features/certificates/rules'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardFooter } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { type Certificate } from '@/db/queries/certificate'
import { cn } from '@/lib/utils'

export const CertificateCard = ({ certificate }: { certificate: Certificate }) => {
  const t = useTranslations('Certificates')
  const tDetail = useTranslations('Certificates.detail')
  const { locale } = useI18n()

  const formatter = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' })
  const period = formatActivityPeriod(certificate, formatter, values => tDetail('periodValue', values))
  const note = certificate.isChangesRequested ? certificate.reviewerComment : null
  const canEdit = certificate.isDraft || certificate.isChangesRequested

  return (
    <Card
      className={cn(
        'gap-0 overflow-hidden p-0 transition-shadow hover:shadow-sm',
        certificate.isApproved && 'border-success/30',
        certificate.isChangesRequested && 'border-warning/40'
      )}
    >
      <Link className="flex flex-col" href={`/certificates/${certificate.id}`}>
        <div className="bg-muted/40 px-6 pt-6">
          <CertificatePreview className="mx-auto max-w-44 rounded-b-none border-b-0" certificate={certificate} />
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <p className="truncate leading-tight font-semibold">{certificate.organization.name}</p>
              <p className="truncate text-sm text-muted-foreground">{certificate.organization.city}</p>
            </div>
            <CertificateStatusBadge status={certificate.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <LucideIcon name="calendar" className="size-3.5 shrink-0" />
              {period}
            </span>
            <span className="flex items-center gap-1.5">
              <LucideIcon name="timer" className="size-3.5 shrink-0" />
              {tDetail('hoursValue', { hours: certificate.activityDuration })}
            </span>
            {certificate.isApproved && certificate.isDefault && (
              <span className="flex items-center gap-1.5 text-brand-text">
                <LucideIcon name="star" className="size-3.5 shrink-0" />
                {tDetail('featuredBadge')}
              </span>
            )}
          </div>
          {note && (
            <div className="flex gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
              <LucideIcon name="triangle-alert" className="mt-0.5 size-4 shrink-0 text-warning" />
              <p className="line-clamp-2 text-sm text-muted-foreground">{note}</p>
            </div>
          )}
        </div>
      </Link>

      {(canEdit || certificate.isApproved) && (
        <CardFooter className="flex flex-wrap items-center gap-2 border-t p-4">
          {canEdit && (
            <Button asChild icon="pencil" size="sm" variant={certificate.isDraft ? 'outline' : 'warning'}>
              <Link href={`/certificates/new?draft=${certificate.id}`}>
                {certificate.isDraft ? t('wizard.continueDraft') : t('resubmitButton')}
              </Link>
            </Button>
          )}
          {certificate.isApproved && certificate.documentUrl && (
            <Button asChild icon="download" size="sm" variant="outline">
              <a download href={certificate.documentUrl} rel="noopener noreferrer" target="_blank">
                {t('download')}
              </a>
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
