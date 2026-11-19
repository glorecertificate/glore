'use client'

import React, { startTransition, useEffect, useLayoutEffect, useState } from 'react'

import { useTranslations } from 'next-intl'
import { Values, useQueryStates } from 'nuqs'

import { AuthAlternatives } from '@/components/features/auth/auth-alternatives'
import { AuthBackLink } from '@/components/features/auth/auth-back-link'
import { AUTH_GLOBE_IDLE, useSetAuthGlobe } from '@/components/features/auth/auth-globe'
import { EmailProviderActions } from '@/components/features/auth/email-provider-actions'
import { LoginForm } from '@/components/features/auth/login-form'
import { authMetaTitleKey, defaultAuthView } from '@/components/features/auth/meta'
import { authParsers } from '@/components/features/auth/params'
import { PasswordRequestForm } from '@/components/features/auth/password-request-form'
import { PasswordResetForm } from '@/components/features/auth/password-reset-form'
import { ResendEmailButton } from '@/components/features/auth/resend-email-button'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { useMetadata } from '@/hooks/use-metadata'
import { MessageKey } from '@/lib/i18n'
import { AuthView, type Enum } from '@/lib/types'
import { camelize, cn } from '@/lib/utils'

const AuthContent = ({
  errored,
  loggedOut,
  next,
  resetToken,
  username,
  view,
  setErrored,
  setUsername,
  setView,
}: {
  errored: boolean
  loggedOut: boolean
  next: string | null
  resetToken: string | null
  username?: string
  view: Enum<AuthView>
  setErrored: React.Dispatch<React.SetStateAction<boolean>>
  setUsername: React.Dispatch<React.SetStateAction<string | undefined>>
  setView: React.Dispatch<React.SetStateAction<Enum<AuthView>>>
}) => {
  const t = useTranslations('Auth')

  switch (view) {
    case 'login':
      return (
        <LoginForm
          errored={errored}
          loggedOut={loggedOut}
          next={next}
          setErrored={setErrored}
          setUsername={setUsername}
          setView={setView}
          username={username}
        />
      )
    case 'password_request':
      return (
        <PasswordRequestForm setErrored={setErrored} setUsername={setUsername} setView={setView} username={username} />
      )
    case 'email_sent':
      return (
        <div className="flex flex-col gap-6">
          <EmailProviderActions />
          <ResendEmailButton username={username} />
        </div>
      )
    case 'password_reset':
      return <PasswordResetForm resetToken={resetToken} setErrored={setErrored} setView={setView} />
    case 'password_updated':
      return (
        <Button
          className="mx-auto justify-center"
          effect="expandIcon"
          icon="arrow-right"
          iconPlacement="right"
          onClick={() => setView('login')}
          variant="outline"
        >
          {t('passwordUpdatedAction')}
        </Button>
      )
    case 'invalid_token':
      return (
        <Button
          className="mx-auto justify-center"
          effect="expandIcon"
          icon="arrow-right"
          iconPlacement="right"
          onClick={() => setView('password_request')}
          variant="outline"
        >
          {t('invalidTokenAction')}
        </Button>
      )
    case 'invalid_password_reset':
      return (
        <Button
          className="mx-auto justify-center"
          effect="expandIcon"
          icon="arrow-right"
          iconPlacement="right"
          onClick={() => setView('password_request')}
          variant="outline"
        >
          {t('invalidPasswordResetAction')}
        </Button>
      )
    default:
      return null
  }
}

const AuthMessage = ({
  className,
  messageKey,
  username,
  view,
  ...props
}: React.ComponentProps<'span'> & {
  messageKey: MessageKey<'Auth'>
  username?: string
  view: Enum<AuthView>
}) => {
  const t = useTranslations('Auth')
  if (!view) return null
  if (view !== 'email_sent') return <p className="text-pretty text-muted-foreground lg:text-base">{t(messageKey)}</p>
  return (
    <div className="text-pretty text-muted-foreground lg:text-base">
      {t.rich('emailSentMessage', {
        email: () => (
          <span className={cn('font-medium break-all text-foreground', className)} {...props}>
            {username}
          </span>
        ),
      })}
    </div>
  )
}

export const AuthFlow = ({
  params,
  username: defaultUsername,
}: {
  params: Values<typeof authParsers>
  username?: string
}) => {
  const t = useTranslations('Auth')

  const [view, setView] = useState<Enum<AuthView>>(() => defaultAuthView(params))
  const [username, setUsername] = useState(defaultUsername)
  const [, setParams] = useQueryStates(authParsers, { history: 'replace' })

  const [errored, setErrored] = useState(false)
  const setGlobe = useSetAuthGlobe()

  const key = camelize(view)
  const title = view ? t(`${key}Title`) : null

  useMetadata({ title: t(authMetaTitleKey(view)) })

  useLayoutEffect(() => {
    const expired = params.expired
    setParams({ error: null, expired: null, loggedOut: null, token: null })
    if (!expired) return
    toast.error(t('sessionExpired'))
  }, [params, setParams, t])

  useEffect(() => {
    setGlobe({ errored, view })
  }, [errored, setGlobe, view])

  useEffect(() => () => setGlobe(AUTH_GLOBE_IDLE), [setGlobe])

  const changeView: React.Dispatch<React.SetStateAction<Enum<AuthView>>> = next => {
    startTransition(() => setView(next))
  }

  const goToLogin = () => {
    if (view === 'password_request') setUsername('')
    changeView('login')
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8" key={view}>
      <div className="flex flex-col gap-2 text-center lg:gap-3">
        {title && <h1 className="type-title text-balance text-fg-title lg:type-display">{title}</h1>}
        <AuthMessage messageKey={`${key}Message`} username={username} view={view} />
      </div>
      <div className="flex w-full flex-col gap-0">
        <AuthContent
          errored={errored}
          loggedOut={params.loggedOut}
          next={params.next}
          resetToken={params.token}
          setErrored={setErrored}
          setUsername={setUsername}
          setView={changeView}
          username={username}
          view={view}
        />
      </div>
      {view !== 'login' && view !== 'password_updated' && (
        <div className="flex justify-center">
          <AuthBackLink onClick={goToLogin} />
        </div>
      )}
      {view === 'login' && <AuthAlternatives />}
    </div>
  )
}
