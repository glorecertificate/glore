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

const STRIPS: Record<string, string> = {
  approved: 'stat-accent-green',
  changes_requested: 'stat-accent-amber',
  in_review: 'stat-accent-navy',
  submitted: 'stat-accent-navy',
}

export const CertificateCard = ({ certificate }: { certificate: Certificate }) => {
  const t = useTranslations('CertificateDetail')
  const tWizard = useTranslations('CertificateWizard')

  const { locale } = useI18n()

  const formatter = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' })
  const period = formatActivityPeriod(certificate, formatter, values => t('periodValue', values))
  const note = certificate.isChangesRequested ? certificate.reviewerComment : null
  const canEdit = certificate.isDraft || certificate.isChangesRequested

  return (
    <Card
      className={cn(
        'relative gap-0 overflow-hidden p-0 transition-shadow duration-150 hover:shadow-stat',
        STRIPS[certificate.status]
      )}
    >
      <span aria-hidden className="absolute inset-x-0 top-0 z-1 h-1 bg-stat-strip" />
      <Link className="flex flex-col" href={`/certificates/${certificate.id}`}>
        <div className="bg-surface-sunken px-6 pt-6">
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
              {t('hoursValue', { hours: certificate.activityDuration })}
            </span>
            {certificate.isApproved && certificate.isDefault && (
              <span className="flex items-center gap-1.5 text-brand-text">
                <LucideIcon name="star" className="size-3.5 shrink-0" />
                {t('featuredBadge')}
              </span>
            )}
          </div>
          {note && (
            <div className="flex gap-2 rounded-lg border border-warning-border bg-warning-subtle p-3">
              <LucideIcon name="triangle-alert" className="mt-0.5 size-4 shrink-0 text-warning-text" />
              <p className="line-clamp-2 text-sm text-muted-foreground">{note}</p>
            </div>
          )}
        </div>
      </Link>

      {(canEdit || (certificate.isApproved && certificate.documentUrl)) && (
        <CardFooter className="flex flex-wrap items-center gap-2 border-t p-4">
          {canEdit && (
            <Button asChild icon="pencil" size="sm" variant={certificate.isDraft ? 'outline' : 'warning'}>
              <Link href={`/certificates/new?draft=${certificate.id}`}>
                {certificate.isDraft ? tWizard('continueDraft') : t('resubmitButton')}
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
