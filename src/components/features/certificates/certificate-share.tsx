'use client'

import { useTranslations } from 'next-intl'

import { linkedInProfileUrl } from '@/components/features/certificates/rules'
import { FacebookIcon } from '@/components/icons/facebook'
import { LinkedinIcon } from '@/components/icons/linkedin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyButton } from '@/components/ui/copy-button'
import { QrCode } from '@/components/ui/qr-code'
import { ShareButton } from '@/components/ui/share-button'
import { type Certificate } from '@/db/queries/certificate'
import { cn } from '@/lib/utils'
import config from '~/config/metadata.json'

const TOUCH =
  'relative pointer-coarse:before:absolute pointer-coarse:before:inset-x-0 pointer-coarse:before:-inset-y-1.5'

export const CertificateShare = ({
  certificate,
  className,
  shareUrl,
  verifyUrl,
}: {
  certificate: Certificate
  className?: string
  shareUrl: string
  verifyUrl: string
}) => {
  const t = useTranslations('CertificateShare')

  if (!(certificate.code && certificate.isApproved)) return null

  const issuedAt = certificate.issuedAt ?? certificate.reviewedAt ?? certificate.updatedAt

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="type-label text-muted-foreground">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2 rounded-md border bg-surface-muted px-3 py-2">
          <span className="min-w-0 flex-1 truncate font-mono text-xs">{shareUrl}</span>
          <CopyButton
            className="relative pointer-coarse:before:absolute pointer-coarse:before:-inset-1.5"
            copiedLabel={t('linkCopied')}
            iconOnly
            label={t('copyLink')}
            value={shareUrl}
          />
        </div>
        <QrCode className="self-center" label={t('qrLabel')} size={144} value={shareUrl} />
        <div className="flex flex-col gap-1.5">
          <Button asChild className={TOUCH} icon="external-link" size="sm" variant="outline">
            <a
              href={linkedInProfileUrl({
                code: certificate.code,
                issuedAt,
                name: t('credentialName'),
                organizationName: config.name,
                url: verifyUrl,
              })}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t('linkedinTitle')}
            </a>
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild className={TOUCH} size="sm" variant="outline">
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <LinkedinIcon className="size-3.5" />
                {t('shareLinkedinShort')}
              </a>
            </Button>
            <Button asChild className={TOUCH} size="sm" variant="outline">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <FacebookIcon className="size-3.5" />
                {t('shareFacebookShort')}
              </a>
            </Button>
          </div>
          <ShareButton
            className={TOUCH}
            copiedLabel={t('linkCopied')}
            failedLabel={t('shareFailed')}
            icon="share-2"
            size="sm"
            title={t('title')}
            url={shareUrl}
            variant="outline"
          >
            {t('share')}
          </ShareButton>
        </div>
      </CardContent>
    </Card>
  )
}
