'use client'

import React, { useLayoutEffect, useRef, useState } from 'react'

import { AnimatePresence, type Variants, m, useIsPresent } from 'motion/react'
import { useTranslations } from 'next-intl'
import { Values, useQueryStates } from 'nuqs'

import { EmailProviderActions } from '@/components/features/auth/email-provider-actions'
import { LoginForm } from '@/components/features/auth/login-form'
import { authMetaTitleKey, defaultAuthView } from '@/components/features/auth/meta'
import { authParsers } from '@/components/features/auth/params'
import { PasswordRequestForm } from '@/components/features/auth/password-request-form'
import { PasswordResetForm } from '@/components/features/auth/password-reset-form'
import { ResendEmailButton } from '@/components/features/auth/resend-email-button'
import { Button } from '@/components/ui/button'
import { Globe, type GlobeColorOptions } from '@/components/ui/globe'
import { LanguageSelect } from '@/components/ui/language-select'
import { Logo } from '@/components/ui/logo'
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

const AuthLogo = ({ onLogoClick, view }: { onLogoClick: () => void; view: Enum<AuthView> }) => {
  const t = useTranslations('Auth')

  return (
    <div title={view === 'login' ? undefined : t('goToLogin')}>
      <Logo
        className={cn(
          'h-8 w-auto rounded-md outline-none focus-visible:focus-ring',
          view === 'login' ? 'pointer-events-none' : 'cursor-pointer'
        )}
        onClick={onLogoClick}
        tabIndex={view === 'login' ? -1 : 0}
      />
    </div>
  )
}

const AuthLanguage = ({
  className,
  contentRef,
  view,
}: {
  className?: string
  contentRef: React.RefObject<HTMLDivElement | null>
  view: Enum<AuthView>
}) => {
  const languageChanged = useRef(false)

  const onCloseAutoFocus = (event: Event) => {
    if (!languageChanged.current) return
    languageChanged.current = false
    if (view !== 'login') return
    event.preventDefault()
    const container = contentRef.current
    if (!container) return
    const fields = ['username', 'password'].map(name =>
      container.querySelector<HTMLInputElement>(`input[name="${name}"]`)
    )
    const emptyField = fields.find(field => field && !field.value)
    if (emptyField) return emptyField.focus()
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  }

  return (
    <LanguageSelect
      className={cn('min-w-28', className)}
      contentProps={{ className: 'data-[state=open]:transition-none', onCloseAutoFocus }}
      onChange={() => {
        languageChanged.current = true
      }}
    />
  )
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
  const colors = hexToRgb(theme.colors[mode])
  const glowColor = hexToRgb({ glow: theme.system.palette['band-from'][mode === 'dark' ? 1 : 0] }).glow
  const options: GlobeColorOptions = { glowColor }

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
  footer,
  params,
  username: defaultUsername,
}: {
  footer?: React.ReactNode
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

  return (
    <MotionFeatures>
      <div className="grid min-h-svh bg-canvas lg:grid-cols-2">
        <aside className="relative isolate flex flex-col items-center gap-4 overflow-hidden bg-band-from px-page pt-5 pb-6 text-band-foreground band-scope lg:min-h-svh lg:justify-between lg:px-12 lg:py-10">
          <div className="flex w-full items-center justify-between gap-4">
            <AuthLogo onLogoClick={() => setView('login')} view={view} />
            <AuthLanguage
              className="border-band-border bg-band-scrim text-band-foreground lg:hidden"
              contentRef={ref}
              view={view}
            />
          </div>
          <Globe className="size-30 shrink-0 lg:size-96 xl:size-112" transitionDuration={600} {...globeOptions} />
          <div className="hidden max-w-sm flex-col gap-3 text-center lg:flex">
            <p className="type-title text-balance text-band-foreground">{t('panelTitle')}</p>
            <p className="text-pretty text-band-text">{t('panelMessage')}</p>
          </div>
        </aside>
        <div className="flex flex-col px-page">
          <div className="hidden justify-end pt-6 lg:flex">
            <AuthLanguage contentRef={ref} view={view} />
          </div>
          <main className="flex flex-1 items-center justify-center py-8">
            <div className="w-full max-w-sm">
              <m.div
                animate={{ height: height ?? 'auto' }}
                className="-mx-2 overflow-hidden"
                initial={false}
                transition={animate ? { duration: 0.32, ease: EASE_IN_OUT } : { duration: 0 }}
              >
                <div className="flex flex-col gap-6 p-2" ref={ref}>
                  <AnimatePresence initial={false} mode="wait">
                    <AuthStep
                      animate="visible"
                      className="flex flex-col gap-8"
                      exit="exit"
                      initial="hidden"
                      key={view}
                      variants={STEP_VARIANTS}
                    >
                      <m.div className="flex flex-col gap-3 text-center lg:text-left" variants={STEP_ITEM_VARIANTS}>
                        {title && <h1 className="type-title text-balance">{title}</h1>}
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
                    </AuthStep>
                  </AnimatePresence>
                </div>
              </m.div>
            </div>
          </main>
          {footer}
        </div>
      </div>
    </MotionFeatures>
  )
}
