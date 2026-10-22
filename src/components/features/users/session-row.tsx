'use client'

import { useFormatter, useNow, useTranslations } from 'next-intl'

import { type SessionSummary } from '@/actions/account/sessions'
import { LucideIcon } from '@/components/icons/lucide'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { describeUserAgent } from '@/lib/user-agent'

export const SessionRow = ({
  busy,
  onRevoke,
  session,
}: {
  busy: boolean
  onRevoke: (id: string) => void
  session: SessionSummary
}) => {
  const t = useTranslations('Users')
  const format = useFormatter()
  const now = useNow({ updateInterval: 60_000 })
  const { browser, system } = describeUserAgent(session.userAgent)
  const mobile = system === 'iOS' || system === 'Android'
  const device =
    browser && system ? t('sessionDevice', { browser, system }) : (browser ?? system ?? t('sessionUnknown'))

  return (
    <li className="flex items-center gap-3 py-3" data-testid="session-row">
      <LucideIcon className="size-5 shrink-0 text-muted-foreground" name={mobile ? 'smartphone' : 'monitor'} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <span className="truncate">{device}</span>
          {session.current && <Badge variant="muted">{t('sessionCurrent')}</Badge>}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {t('sessionActive', { time: format.relativeTime(new Date(session.updatedAt), now) })}
          {session.ipAddress ? ` · ${session.ipAddress}` : ''}
        </p>
      </div>
      {!session.current && (
        <Button disabled={busy} onClick={() => onRevoke(session.id)} size="sm" type="button" variant="outline">
          {t('sessionRevoke')}
        </Button>
      )}
    </li>
  )
}
