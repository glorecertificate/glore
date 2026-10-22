'use client'

import Link from 'next/link'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'

export type ClosedStatus = 'accepted' | 'declined' | 'exhausted' | 'expired' | 'invalid' | 'revoked'

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

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <LucideIcon
          className="size-8 text-muted-foreground"
          name={status === 'accepted' ? 'circle-check' : 'circle-alert'}
        />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t(`status_${status}_title`)}</h1>
        <p className="text-muted-foreground">
          {t(`status_${status}_description`, { organization: organization ?? '' })}
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href={signedIn ? APP_ROOT : AUTH_ROOT}>{signedIn ? t('goToDashboard') : t('goToLogin')}</Link>
      </Button>
    </div>
  )
}
