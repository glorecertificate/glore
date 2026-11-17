'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { listSessions, revokeOtherSessions, revokeSession } from '@/actions/account/sessions'
import { SessionRow } from '@/components/features/users/session-row'
import { SettingsSection } from '@/components/features/users/settings-section'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { useSession } from '@/components/providers/session'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { usePoll } from '@/hooks/use-poll'

const REFRESH_INTERVAL = 60_000

export const SessionsList = () => {
  const t = useTranslations('Users')
  const { impersonating } = useSession()
  const [busy, setBusy] = useState(false)
  const { data, refresh } = usePoll(listSessions, { interval: REFRESH_INTERVAL })

  const sessions = data?.data ?? []
  const others = sessions.filter(({ current }) => !current)

  const handleRevoke = async (id: string) => {
    setBusy(true)
    const { error } = await revokeSession(id)
    setBusy(false)
    if (error) {
      toast.error(t('sessionRevokeError'))
      return
    }
    toast.success(t('sessionRevoked'))
    refresh()
  }

  const handleRevokeOthers = async () => {
    setBusy(true)
    const { error } = await revokeOtherSessions()
    setBusy(false)
    if (error) {
      toast.error(t('sessionRevokeError'))
      return
    }
    toast.success(t('sessionsRevoked'))
    refresh()
  }

  return (
    <SettingsSection description={t('sessionsDescription')} title={t('sessions')}>
      {!data && <LoadingFallback className="h-16" />}
      {data?.error && <p className="text-sm text-destructive-text">{t('sessionsError')}</p>}
      {sessions.length > 0 && (
        <ul className="animate-reveal divide-y rounded-lg border px-4" data-testid="sessions-list">
          {sessions.map(session => (
            <SessionRow busy={busy || impersonating} key={session.id} onRevoke={handleRevoke} session={session} />
          ))}
        </ul>
      )}
      {others.length > 0 && (
        <div className="flex justify-end">
          <Button disabled={busy || impersonating} onClick={handleRevokeOthers} type="button" variant="outline">
            {t('sessionsRevokeOthers')}
          </Button>
        </div>
      )}
    </SettingsSection>
  )
}
