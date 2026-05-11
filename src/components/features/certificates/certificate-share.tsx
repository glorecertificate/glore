'use client'

import { useState } from 'react'

import { CheckIcon, CopyIcon, ShareIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { FacebookIcon } from '@/components/icons/facebook'
import { LinkedinIcon } from '@/components/icons/linkedin'
import { Button } from '@/components/ui/button'
import { type Certificate } from '@/db/queries/certificate'
import { useSession } from '@/hooks/use-session'
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
  const [copied, setCopied] = useState(false)

  const username = user.username
  const publicUrl = username ? `${config.url}/${username}?v=${certificate.handle}` : null

  const linkedInUrl = publicUrl
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`
    : null

  const facebookUrl = publicUrl ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}` : null

  const copyLink = async () => {
    if (!publicUrl) return
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    toast.success(t('shareLinkCopied'))
    setTimeout(() => setCopied(false), 2000)
  }

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
      <Button icon={copied ? CheckIcon : CopyIcon} onClick={() => void copyLink()} size="sm" variant="outline">
        {copied ? t('shareLinkCopied') : t('copyLink')}
      </Button>
    </div>
  )
}
