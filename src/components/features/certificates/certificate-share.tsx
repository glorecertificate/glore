'use client'

import { ShareIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { FacebookIcon } from '@/components/icons/facebook'
import { LinkedinIcon } from '@/components/icons/linkedin'
import { useSession } from '@/components/providers/session'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { type Certificate } from '@/db/queries/certificate'
import { cn } from '@/lib/utils'
import config from '~/config/metadata.json'

interface CertificateShareProps {
  certificate: Certificate
  className?: string
}

export const CertificateShare = ({ certificate, className }: CertificateShareProps) => {
  const t = useTranslations('Certificates')
  const tCommon = useTranslations('Common')
  const { user } = useSession()

  const username = user.username
  const publicUrl = username ? `${config.url}/${username}?v=${certificate.handle}` : null

  const linkedInUrl = publicUrl
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`
    : null

  const facebookUrl = publicUrl ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}` : null

  if (!publicUrl) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <ShareIcon className="size-3.5" />
        {tCommon('share')}
      </span>
      {linkedInUrl && (
        <Button asChild size="sm" variant="outline">
          <a href={linkedInUrl} rel="noopener noreferrer" target="_blank">
            <LinkedinIcon className="size-3.5" />
            {'LinkedIn'}
          </a>
        </Button>
      )}
      {facebookUrl && (
        <Button asChild size="sm" variant="outline">
          <a href={facebookUrl} rel="noopener noreferrer" target="_blank">
            <FacebookIcon className="size-3.5" />
            {'Facebook'}
          </a>
        </Button>
      )}
      <CopyButton copiedLabel={t('shareLinkCopied')} label={t('copyLink')} size="sm" value={publicUrl} />
    </div>
  )
}
