'use client'

import React, { useLayoutEffect, useRef, useState } from 'react'

import { ArrowRightIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { Values, useQueryStates } from 'nuqs'
import { toast } from 'sonner'

import { EmailProviderActions } from '@/components/features/auth/email-provider-actions'
import { LoginForm } from '@/components/features/auth/login-form'
import { authParsers } from '@/components/features/auth/params'
import { PasswordRequestForm } from '@/components/features/auth/password-request-form'
import { PasswordResetForm } from '@/components/features/auth/password-reset-form'
import { ResendEmailButton } from '@/components/features/auth/resend-email-button'
import { Button } from '@/components/ui/button'
import { Globe, type GlobeColorOptions } from '@/components/ui/globe'
import { LanguageSelect } from '@/components/ui/language-select'
import { Logo } from '@/components/ui/logo'
import { useMetadata } from '@/hooks/use-metadata'
import { useTheme } from '@/hooks/use-theme'
import { MessageKey } from '@/lib/i18n'
import { AuthView, type Enum } from '@/lib/types'
import { camelize, cn, hexToRgb } from '@/lib/utils'
import theme from '~/config/theme.json'

const AuthHeader = ({
  className,
  contentRef,
  onLogoClick,
  view,
  ...props
}: React.ComponentProps<'div'> & {
  contentRef: React.RefObject<HTMLDivElement | null>
  onLogoClick: () => void
  view: Enum<AuthView>
}) => {
  const t = useTranslations('Auth')
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
    <div className={cn('flex justify-between gap-2', className)} {...props}>
      <div title={view === 'login' ? undefined : t('goToLogin')}>
        <Logo
          className={cn(
            'w-24 rounded-md px-2 focus:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
            view === 'login' ? 'pointer-events-none' : 'cursor-pointer'
          )}
          onClick={onLogoClick}
          tabIndex={view === 'login' ? -1 : 0}
        />
      </div>
      <div className="flex flex-col items-center gap-2">
        <LanguageSelect
          className="min-w-28 border"
          contentProps={{ className: 'data-[state=open]:transition-none', onCloseAutoFocus }}
          onChange={() => {
            languageChanged.current = true
          }}
        />
      </div>
    </div>
  )
}

const AuthContent = ({
  errored,
  loggedOut,
  resetToken,
  username,
  view,
  setErrored,
  setUsername,
  setView,
}: {
  errored: boolean
  loggedOut: boolean
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
          icon={ArrowRightIcon}
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
          icon={ArrowRightIcon}
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
          icon={ArrowRightIcon}
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
  if (view !== 'email_sent') return t(messageKey)
  return (
    <div>
      {t.rich('emailSentMessage', {
        email: () => <span className={cn('text-brand', className)} {...props}>{` ${username} `}</span>,
      })}
    </div>
  )
}

const useGlobeOptions = ({ errored, view }: { errored: boolean; view: Enum<AuthView> }) => {
  const { resolvedTheme } = useTheme()
  const colors = hexToRgb(theme.colors[resolvedTheme ?? 'light'])
  const options: GlobeColorOptions = { glowColor: colors.background }

  if (errored || view === 'invalid_token' || view === 'invalid_password_reset') {
    return { ...options, baseColor: colors.destructive }
  }

  switch (view) {
    case 'login':
      return { ...options, baseColor: colors.brand }
    case 'password_request':
      return { ...options, baseColor: colors.neutral }
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

  const defaultView = params.error === 'INVALID_TOKEN' ? 'invalid_token' : params.token ? 'password_reset' : 'login'
  const [view, setView] = useState(defaultView as Enum<AuthView>)
  const [username, setUsername] = useState(defaultUsername)
  const [, setParams] = useQueryStates(authParsers, { history: 'replace' })

  const [height, setHeight] = useState<number>()
  const [animate, setAnimate] = useState(false)
  const [errored, setErrored] = useState(false)
  const globeOptions = useGlobeOptions({ errored, view })

  const ref = useRef<HTMLDivElement>(null)
  const key = camelize(view)
  const title = view ? t(`${key}Title`) : null

  useMetadata({
    title: t(`${key}MetaTitle`),
    suffix: view === 'login' ? false : undefined,
  })

  useLayoutEffect(() => {
    const expired = params.expired
    setParams(null)
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
    <>
      <AuthHeader contentRef={ref} onLogoClick={() => setView('login')} view={view} />
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md">
          <motion.div
            animate={{ height: height ?? 'auto' }}
            className="overflow-hidden"
            initial={false}
            transition={animate ? { type: 'spring', bounce: 0, duration: 0.2 } : { duration: 0 }}
          >
            <div className="flex min-h-137.5 flex-col gap-8" ref={ref}>
              <div className="flex flex-col gap-8">
                <Globe className="mx-auto size-80" transitionDuration={200} {...globeOptions} />
                <AnimatePresence mode="wait">
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-2 text-center"
                    exit={{ opacity: 0, y: -8 }}
                    initial={{ opacity: 0, y: 8 }}
                    key={`heading-${view}`}
                    transition={{ duration: 0.1, ease: 'easeOut' }}
                  >
                    {title && <h1 className="text-3xl font-semibold">{title}</h1>}
                    <AuthMessage messageKey={`${key}Message`} username={username} view={view} />
                  </motion.div>
                </AnimatePresence>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-auto flex w-full max-w-88 flex-col gap-0"
                  exit={{ opacity: 0, y: -8 }}
                  initial={{ opacity: 0, y: 8 }}
                  key={`content-${view}`}
                  transition={{ duration: 0.1, ease: 'easeOut' }}
                >
                  <AuthContent
                    errored={errored}
                    loggedOut={params.loggedOut}
                    resetToken={params.token}
                    setErrored={setErrored}
                    setUsername={setUsername}
                    setView={setView}
                    username={username}
                    view={view}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
