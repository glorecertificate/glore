'use client'

import React, { useLayoutEffect, useRef, useState } from 'react'

import { AnimatePresence, type Variants, m, useIsPresent } from 'motion/react'
import { useTranslations } from 'next-intl'
import { Values, useQueryStates } from 'nuqs'

import { AuthAlternatives } from '@/components/features/auth/auth-alternatives'
import { AuthBackLink } from '@/components/features/auth/auth-back-link'
import { EmailProviderActions } from '@/components/features/auth/email-provider-actions'
import { LoginForm } from '@/components/features/auth/login-form'
import { authMetaTitleKey, defaultAuthView } from '@/components/features/auth/meta'
import { authParsers } from '@/components/features/auth/params'
import { PasswordRequestForm } from '@/components/features/auth/password-request-form'
import { PasswordResetForm } from '@/components/features/auth/password-reset-form'
import { ResendEmailButton } from '@/components/features/auth/resend-email-button'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Globe, type GlobeColorOptions } from '@/components/ui/globe'
import { MotionFeatures } from '@/components/ui/motion-features'
import { toast } from '@/components/ui/toast'
import { useMetadata } from '@/hooks/use-metadata'
import { useTheme } from '@/hooks/use-theme'
import { MessageKey } from '@/lib/i18n'
import { EASE_IN_OUT, EASE_OUT } from '@/lib/motion'
import { AuthView, type Enum } from '@/lib/types'
import { camelize, cn, hexToRgb } from '@/lib/utils'
import theme from '~/config/theme.json'

const STEP_VARIANTS = {
  exit: { filter: 'blur(2px)', opacity: 0, transition: { duration: 0.15, ease: EASE_OUT }, y: -4 },
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
} satisfies Variants

const STEP_ITEM_VARIANTS = {
  hidden: { filter: 'blur(2px)', opacity: 0, y: 6 },
  visible: { filter: 'blur(0px)', opacity: 1, transition: { duration: 0.3, ease: EASE_OUT }, y: 0 },
} satisfies Variants

const AuthStep = (props: React.ComponentProps<typeof m.div>) => {
  const isPresent = useIsPresent()
  return <m.div inert={!isPresent} {...props} />
}

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
          size="lg"
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
          size="lg"
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
          size="lg"
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
  if (view !== 'email_sent') return <p className="text-pretty text-muted-foreground">{t(messageKey)}</p>
  return (
    <div className="text-pretty text-muted-foreground">
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

const useGlobeOptions = ({ errored, view }: { errored: boolean; view: Enum<AuthView> }) => {
  const { resolvedTheme } = useTheme()
  const mode = resolvedTheme ?? 'light'
  const colors = hexToRgb({ ...theme.colors[mode], canvas: theme.system.palette.canvas[mode === 'dark' ? 1 : 0] })
  const options: GlobeColorOptions = { glowColor: colors.canvas }

  if (errored || view === 'invalid_token' || view === 'invalid_password_reset') {
    return { ...options, baseColor: colors.destructive }
  }

  switch (view) {
    case 'login':
      return { ...options, baseColor: [colors.brand, colors.brandSecondary, colors.brandTertiary] }
    case 'password_request':
    case 'password_reset':
      return { ...options, baseColor: colors.warning }
    case 'password_updated':
    case 'email_sent':
      return { ...options, baseColor: colors.success }
    default:
      return options
  }
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

  const [height, setHeight] = useState<number>()
  const [animate, setAnimate] = useState(false)
  const [errored, setErrored] = useState(false)
  const globeOptions = useGlobeOptions({ errored, view })

  const ref = useRef<HTMLDivElement>(null)
  const key = camelize(view)
  const title = view ? t(`${key}Title`) : null

  useMetadata({ title: t(authMetaTitleKey(view)) })

  useLayoutEffect(() => {
    const expired = params.expired
    setParams({ error: null, expired: null, loggedOut: null, token: null })
    if (!expired) return
    toast.error(t('sessionExpired'))
  }, [params, setParams, t])

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => {
      const next = element.offsetHeight
      if (next === 0) return
      setHeight(prev => (prev === next ? prev : next))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  if (height !== undefined && !animate) {
    setAnimate(true)
  }

  const goToLogin = () => {
    if (view === 'password_request') setUsername('')
    setView('login')
  }

  return (
    <MotionFeatures>
      <main className="flex flex-1 justify-center px-page py-8 sm:py-10 lg:py-14" data-slot="auth-main">
        <div className="grid w-full max-w-5xl content-start items-start gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col items-center gap-6 text-center">
            <Globe className="mx-auto size-64 lg:-mb-6 lg:size-120" transitionDuration={600} {...globeOptions} />
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-semibold text-balance text-fg-title lg:text-4xl">{t('heroTitle')}</h2>
              <p className="mx-auto max-w-sm text-pretty text-muted-foreground">{t('heroMessage')}</p>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md lg:mx-0">
            <m.div
              animate={{ height: height ?? 'auto' }}
              className="-m-3 overflow-hidden"
              initial={false}
              transition={animate ? { duration: 0.32, ease: EASE_IN_OUT } : { duration: 0 }}
            >
              <div className="flex flex-col p-3" ref={ref}>
                <AnimatePresence initial={false} mode="wait">
                  <AuthStep
                    animate="visible"
                    className="flex flex-col gap-6"
                    exit="exit"
                    initial="hidden"
                    key={view}
                    variants={STEP_VARIANTS}
                  >
                    {view !== 'login' && view !== 'password_updated' && (
                      <m.div variants={STEP_ITEM_VARIANTS}>
                        <AuthBackLink onClick={goToLogin} />
                      </m.div>
                    )}
                    <Card className="gap-6 p-6 sm:p-8">
                      <m.div className="flex flex-col gap-2 text-center" variants={STEP_ITEM_VARIANTS}>
                        {title && <h1 className="text-2xl font-semibold text-fg-title">{title}</h1>}
                        <AuthMessage messageKey={`${key}Message`} username={username} view={view} />
                      </m.div>
                      <m.div className="flex w-full flex-col gap-0" variants={STEP_ITEM_VARIANTS}>
                        <AuthContent
                          errored={errored}
                          loggedOut={params.loggedOut}
                          next={params.next}
                          resetToken={params.token}
                          setErrored={setErrored}
                          setUsername={setUsername}
                          setView={setView}
                          username={username}
                          view={view}
                        />
                      </m.div>
                    </Card>
                    {view === 'login' && (
                      <m.div variants={STEP_ITEM_VARIANTS}>
                        <AuthAlternatives />
                      </m.div>
                    )}
                  </AuthStep>
                </AnimatePresence>
              </div>
            </m.div>
          </div>
        </div>
      </main>
    </MotionFeatures>
  )
}
