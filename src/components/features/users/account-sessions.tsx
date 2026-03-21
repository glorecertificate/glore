'use client'

import { Fragment, useCallback, useState, useTransition } from 'react'

import { MonitorIcon, SmartphoneIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { revokeAllOtherSessions, revokeUserSession } from '@/actions/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useI18n } from '@/hooks/use-i18n'

interface UserSession {
  id: string
  token: string
  createdAt: string
  expiresAt: string
  ipAddress: string | null
  userAgent: string | null
  userId: string
}

interface AccountSessionsProps {
  currentToken: string | null
  sessions: UserSession[]
}

const parseUserAgent = (ua: string | null) => {
  if (!ua) return { isMobile: false, label: 'Unknown device' }

  const isMobile = /mobile|android|iphone|ipad/i.test(ua)

  let browser = 'Unknown browser'
  if (/edg\//i.test(ua)) browser = 'Edge'
  else if (/firefox/i.test(ua)) browser = 'Firefox'
  else if (/opr\//i.test(ua)) browser = 'Opera'
  else if (/chrome/i.test(ua)) browser = 'Chrome'
  else if (/safari/i.test(ua)) browser = 'Safari'

  let os = 'Unknown OS'
  if (/windows/i.test(ua)) os = 'Windows'
  else if (/ipad|iphone/i.test(ua)) os = 'iOS'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/mac/i.test(ua)) os = 'macOS'
  else if (/linux/i.test(ua)) os = 'Linux'

  return { isMobile, label: `${browser} on ${os}` }
}

export const AccountSessions = ({ currentToken, sessions }: AccountSessionsProps) => {
  const t = useTranslations('Users')
  const { locale } = useI18n()
  const [isPending, startTransition] = useTransition()
  const [revokingToken, setRevokingToken] = useState<string | null>(null)

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })

  const handleRevoke = useCallback(
    (token: string) => {
      setRevokingToken(token)
      startTransition(async () => {
        try {
          await revokeUserSession(token)
          toast.success(t('revokeSessionSuccess'))
        } catch {
          toast.error(t('revokeSessionError'))
        } finally {
          setRevokingToken(null)
        }
      })
    },
    [t]
  )

  const handleRevokeAll = useCallback(() => {
    startTransition(async () => {
      try {
        await revokeAllOtherSessions()
        toast.success(t('revokeAllSessionsSuccess'))
      } catch {
        toast.error(t('revokeAllSessionsError'))
      }
    })
  }, [t])

  const otherSessions = sessions.filter(s => s.token !== currentToken)

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border">
        {sessions.map((session, i) => {
          const isCurrent = session.token === currentToken
          const { isMobile, label } = parseUserAgent(session.userAgent)
          const DeviceIcon = isMobile ? SmartphoneIcon : MonitorIcon

          return (
            <Fragment key={session.id}>
              {i > 0 && <Separator />}
              <div className="flex items-start justify-between gap-4 px-4 py-3">
                <div className="flex items-start gap-3">
                  <DeviceIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{label}</span>
                      {isCurrent && (
                        <Badge className="text-[11px]" variant="muted">
                          {t('currentSession')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.ipAddress ?? t('unknownIp')}
                      {' · '}
                      {t('signedInAt', { date: dateFormatter.format(new Date(session.createdAt)) })}
                    </p>
                  </div>
                </div>
                {!isCurrent && (
                  <Button
                    className="shrink-0"
                    disabled={isPending}
                    loading={revokingToken === session.token}
                    onClick={() => handleRevoke(session.token)}
                    size="sm"
                    variant="outline"
                  >
                    {t('signOut')}
                  </Button>
                )}
              </div>
            </Fragment>
          )
        })}
      </div>
      {otherSessions.length > 0 && (
        <div className="flex justify-end">
          <Button
            disabled={isPending}
            loading={isPending && !revokingToken}
            onClick={handleRevokeAll}
            size="sm"
            variant="outline"
          >
            {t('signOutAll')}
          </Button>
        </div>
      )}
    </div>
  )
}
