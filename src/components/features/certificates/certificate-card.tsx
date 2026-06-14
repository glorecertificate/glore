'use client'

import { Building2Icon, CalendarIcon, DownloadIcon, PencilIcon, TimerIcon, TriangleAlertIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CertificateShare } from '@/components/features/certificates/certificate-share'
import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { useI18n } from '@/components/providers/i18n'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Image } from '@/components/ui/image'
import { Link } from '@/components/ui/link'
import { type Certificate } from '@/db/queries/certificate'
import { cn } from '@/lib/utils'

interface CertificateCardProps {
  certificate: Certificate
}

export const CertificateCard = ({ certificate }: CertificateCardProps) => {
  const t = useTranslations('Certificates')
  const { locale, localize } = useI18n()

  const formatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short' })
  const start = formatter.format(new Date(certificate.activityStartDate))
  const end = formatter.format(new Date(certificate.activityEndDate))

  return (
    <Card
      className={cn(
        'gap-4 transition-shadow hover:shadow-sm',
        certificate.isApproved && 'border-success/30 bg-success/5',
        certificate.isChangesRequested && 'border-warning/40 bg-warning/5',
        certificate.isPending && 'border-info/30 bg-info/5'
      )}
    >
      <Link className="flex flex-col gap-4" href={`/certificates/${certificate.id}`}>
        <CardHeader className="flex flex-row items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-card">
            {certificate.organization.avatarUrl ? (
              <Image
                alt={certificate.organization.name}
                className="size-full object-cover"
                height={40}
                src={certificate.organization.avatarUrl}
                unoptimized
                width={40}
              />
            ) : (
              <Building2Icon className="size-5 text-brand" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="truncate leading-tight font-semibold">{certificate.organization.name}</p>
            <p className="truncate text-sm text-muted-foreground">{certificate.organization.city}</p>
          </div>
          <CertificateStatusBadge status={certificate.status} />
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-3.5 shrink-0" />
              {start} {'– '}
              {end}
            </span>
            <span className="flex items-center gap-1.5">
              <TimerIcon className="size-3.5 shrink-0" />
              {certificate.activityDuration}
              {'h'}
            </span>
          </div>

          {certificate.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {certificate.skills.map(s => (
                <Badge key={s.id} variant="muted">
                  {s.course.title ? localize(s.course.title) : s.course.slug}
                </Badge>
              ))}
            </div>
          )}

          {certificate.isChangesRequested && certificate.reviewerComment && (
            <div className="flex gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" />
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium">{t('reviewerCommentLabel')}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{certificate.reviewerComment}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Link>

      {certificate.isApproved && (
        <CardFooter className="flex flex-wrap items-center gap-2 border-t pt-4">
          {certificate.documentUrl && (
            <Button asChild icon={DownloadIcon} size="sm" variant="outline">
              <a download href={certificate.documentUrl} rel="noopener noreferrer" target="_blank">
                {t('download')}
              </a>
            </Button>
          )}
          <CertificateShare certificate={certificate} />
        </CardFooter>
      )}

      {certificate.isChangesRequested && (
        <CardFooter className="border-t pt-4">
          <Button asChild icon={PencilIcon} size="sm" variant="warning">
            <Link href={`/certificates/${certificate.id}`}>{t('resubmitButton')}</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
