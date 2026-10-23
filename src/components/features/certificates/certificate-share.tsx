'use client'

import { useTranslations } from 'next-intl'

import { linkedInProfileUrl } from '@/components/features/certificates/rules'
import { FacebookIcon } from '@/components/icons/facebook'
import { LinkedinIcon } from '@/components/icons/linkedin'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyButton } from '@/components/ui/copy-button'
import { QrCode } from '@/components/ui/qr-code'
import { type Certificate } from '@/db/queries/certificate'
import { cn } from '@/lib/utils'
import config from '~/config/metadata.json'

export const CertificateShare = ({
  certificate,
  className,
  url,
}: {
  certificate: Certificate
  className?: string
  url: string
}) => {
  const t = useTranslations('CertificateShare')
  const { locale } = useI18n()

  if (!(certificate.code && certificate.isApproved)) return null

  const issuedAt = certificate.issuedAt ?? certificate.reviewedAt ?? certificate.updatedAt
  const credentialName = t('credentialName')
  const issued = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(issuedAt))
  const pdfHref = certificate.documentUrl ?? `/api/v1/certificates/${certificate.id}/pdf`

  const fields = [
    { key: 'name', label: t('fieldName'), value: credentialName },
    { key: 'organization', label: t('fieldOrganization'), value: config.name },
    { key: 'issued', label: t('fieldIssued'), value: issued },
    { key: 'url', label: t('fieldUrl'), value: url },
    { key: 'id', label: t('fieldId'), value: certificate.code },
  ]

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <QrCode className="shrink-0" label={t('qrLabel')} size={128} value={url} />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{url}</span>
              <CopyButton copiedLabel={t('linkCopied')} label={t('copyLink')} size="sm" value={url} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild icon="download" size="sm" variant="outline">
                <a href={pdfHref} rel="noopener noreferrer" target="_blank">
                  {t('downloadPdf')}
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <LinkedinIcon className="size-3.5" />
                  {t('shareLinkedin')}
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <FacebookIcon className="size-3.5" />
                  {t('shareFacebook')}
                </a>
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{t('linkedinTitle')}</p>
              <p className="text-xs text-muted-foreground">{t('linkedinHint')}</p>
            </div>
            <Button asChild icon="external-link" size="sm" variant="brand">
              <a
                href={linkedInProfileUrl({
                  code: certificate.code,
                  issuedAt,
                  name: credentialName,
                  organizationName: config.name,
                  url,
                })}
                rel="noopener noreferrer"
                target="_blank"
              >
                {t('linkedinAdd')}
              </a>
            </Button>
          </div>
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {fields.map(field => (
              <div
                className="flex min-w-0 items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-1.5"
                key={field.key}
              >
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{field.label}</dt>
                  <dd className="text-sm wrap-anywhere">{field.value}</dd>
                </div>
                <CopyButton
                  aria-label={t('copyField', { field: field.label })}
                  className="shrink-0"
                  copiedLabel={t('linkCopied')}
                  size="sm"
                  value={field.value}
                />
              </div>
            ))}
          </dl>
        </div>
      </CardContent>
    </Card>
  )
}
