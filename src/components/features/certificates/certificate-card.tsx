'use client'

import { CalendarIcon, MapPinIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Certificate } from '@/db/queries/certificate'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/lib/utils'

interface CertificateCardProps {
  certificate: Certificate
}

export const CertificateCard = ({ certificate }: CertificateCardProps) => {
  const t = useTranslations('Certificates')
  const { locale } = useI18n()

  const formatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short' })
  const start = formatter.format(new Date(certificate.activityStartDate))
  const end = formatter.format(new Date(certificate.activityEndDate))

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-sm',
        certificate.isApproved && 'border-success/30 bg-success/5',
        certificate.isChangesRequested && 'border-destructive/30',
        certificate.isPending && 'border-info/30 bg-info/5'
      )}
    >
      <CardHeader>
        <CardTitle className="text-base">{certificate.organization.name}</CardTitle>
        <CardAction>
          <CertificateStatusBadge status={certificate.status} />
        </CardAction>
      </CardHeader>
      <CardContent className="mt-2 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarIcon className="size-3.5 shrink-0" />
          <span>
            {start} – {end}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPinIcon className="size-3.5 shrink-0" />
          <span>{certificate.activityLocation}</span>
        </div>
        {certificate.isApproved && certificate.issuedAt && (
          <p className="mt-1 text-xs text-success">
            {t('issuedOn')}{' '}
            {new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(certificate.issuedAt))}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
