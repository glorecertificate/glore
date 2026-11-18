'use client'

import Link from 'next/link'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { type IconName } from '@/components/icons/registry'
import { Button } from '@/components/ui/button'
import { APP_ROOT, AUTH_ROOT } from '@/lib/constants'
import { cn } from '@/lib/utils'

export type ClosedStatus = 'accepted' | 'declined' | 'exhausted' | 'expired' | 'invalid' | 'member' | 'revoked'

type Tone = 'neutral' | 'success' | 'warning'

const STATUS_MEDIA: Record<ClosedStatus, { icon: IconName; tone: Tone }> = {
  accepted: { icon: 'circle-check', tone: 'success' },
  declined: { icon: 'circle-x', tone: 'neutral' },
  exhausted: { icon: 'circle-alert', tone: 'warning' },
  expired: { icon: 'alarm-clock', tone: 'warning' },
  invalid: { icon: 'search-x', tone: 'neutral' },
  member: { icon: 'circle-check', tone: 'success' },
  revoked: { icon: 'circle-x', tone: 'neutral' },
}

const TONES = {
  neutral: 'bg-surface-muted text-muted-foreground',
  success: 'bg-success-subtle text-success-text',
  warning: 'bg-warning-subtle text-warning-text',
} satisfies Record<Tone, string>

export const StatusMedia = ({ icon, tone }: { icon: IconName; tone: Tone }) => (
  <div aria-hidden className={cn('flex size-16 items-center justify-center rounded-full', TONES[tone])}>
    <LucideIcon className="size-8" name={icon} />
  </div>
)

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

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <StatusMedia {...media} />
      <div className="space-y-2">
        <h1 className="type-title text-balance">{t(`status_${status}_title`)}</h1>
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
