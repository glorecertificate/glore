'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'

import { type ClosedStatus, STATUS_MEDIA, StatusMedia } from './status-media'

export const InvitationStatus = ({
  organization,
  signedIn,
  status,
}: {
  organization?: string
  signedIn: boolean
  status: ClosedStatus
}) => {
  const t = useTranslations('Invite')
  const media = STATUS_MEDIA[status]
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (document.activeElement && document.activeElement !== document.body) return
    heading.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <StatusMedia {...media} />
      <div className="space-y-2">
        <h1 className="type-title text-balance outline-none" ref={heading} tabIndex={-1}>
          {t(`status_${status}_title`)}
        </h1>
        <p className="text-pretty text-muted-foreground">
          {t(`status_${status}_description`, { organization: organization ?? '' })}
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href={signedIn ? APP_ROOT : AUTH_ROOT}>{signedIn ? t('goToDashboard') : t('goToLogin')}</Link>
      </Button>
    </div>
  )
}
