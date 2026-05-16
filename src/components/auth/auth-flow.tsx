'use client'

import dynamic from 'next/dynamic'
import { useLayoutEffect, useRef, useState } from 'react'

import { ArrowRightIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { EmailProviderActions } from '@/components/auth/email-provider-actions'
import { LoginForm } from '@/components/auth/login-form'
import { PasswordRequestForm } from '@/components/auth/password-request-form'
import { PasswordResetForm } from '@/components/auth/password-reset-form'
import { ResendEmailButton } from '@/components/auth/resend-email-button'
import { Button } from '@/components/ui/button'
import { type GlobeColorOptions } from '@/components/ui/globe'
import { LanguageSelect } from '@/components/ui/language-select'
import { Logo } from '@/components/ui/logo'
import { useMetadata } from '@/hooks/use-metadata'
import { useTheme } from '@/hooks/use-theme'
import { EMAIL_REGEX } from '@/lib/constants'
import { AuthView, type Enum } from '@/lib/types'
import { camelize, cn, hexToRgb } from '@/lib/utils'
import theme from '~/config/theme.json'

const Globe = dynamic(async () => (await import('@/components/ui/globe')).Globe, { ssr: false })

const motionAnimate = { opacity: 1, y: 0 }
const motionExit = { opacity: 0, y: -8 }
const motionInitial = { opacity: 0, y: 8 }
const motionTransition = { duration: 0.15, ease: 'easeOut' } as const

export const AuthFlow = ({
  resetToken,
  sessionExpired,
  ...value
}: {
  resetToken: string | null
  sessionExpired?: boolean
  username?: string
  view: Enum<AuthView>
}) => {
  const t = useTranslations('Auth')
  const { resolvedTheme } = useTheme()

  const [view, setView] = useState(value.view)
  const [username, setUsername] = useState(value.username)
  const [errored, setErrored] = useState(false)

  useLayoutEffect(() => {
    if (!sessionExpired) return
    toast.error(t('sessionExpired'))
  }, [sessionExpired, t])

  useMetadata({
    applicationName: view === 'login' ? false : 'full',
    title: t(camelize(`${view}_meta_title`)),
  })

  const title = view ? t(camelize(`${view}_title`)) : null

  const message = (() => {
    if (!view) {
      return null
    }
    if (view !== 'email_sent') {
      return t(camelize(`${view}_message`))
    }
    return t.rich('emailSentMessage', {
      email: () =>
        username && EMAIL_REGEX.test(username) ? <span className="text-brand">{` ${username} `}</span> : null,
    })
  })()

  const content = (() => {
    switch (view) {
      case 'login':
        return (
          <LoginForm
            errored={errored}
            setErrored={setErrored}
            setUsername={setUsername}
            setView={setView}
            username={username}
          />
        )
      case 'password_request':
        return (
          <PasswordRequestForm
            setErrored={setErrored}
            setUsername={setUsername}
            setView={setView}
            username={username}
          />
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
  })()

  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number>()

  useLayoutEffect(() => {
    if (view !== 'login') return

    const element = ref.current
    if (!element) return

    const measureHeight = (el: HTMLDivElement) => {
      const { height: newHeight } = el.getBoundingClientRect()
      if (newHeight === 0) return
      setHeight(newHeight)
    }

    measureHeight(element)

    const observer = new ResizeObserver(() => measureHeight(element))
    observer.observe(element)
    return () => observer.disconnect()
  }, [view])

  const containerStyle = height ? { minHeight: height } : {}

  const globeColorOptions: GlobeColorOptions = (() => {
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
  })()

  return (
    <>
      <div className="flex justify-between gap-2">
        <div title={view === 'login' ? undefined : t('goToLogin')}>
          <Logo
            className={cn(
              'w-24 rounded-md px-2 focus:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
              view === 'login' ? 'pointer-events-none' : 'cursor-pointer'
            )}
            onClick={() => setView('login')}
            tabIndex={view === 'login' ? -1 : 0}
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <LanguageSelect className="min-w-28 border" />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md">
          <div className="flex min-h-137.5 flex-col gap-8" ref={ref} style={containerStyle}>
            <div className="flex flex-col gap-8">
              <Globe className="mx-auto size-80" transitionDuration={200} {...globeColorOptions} />
              <AnimatePresence mode="wait">
                <motion.div
                  animate={motionAnimate}
                  className="flex flex-col gap-2 text-center"
                  exit={motionExit}
                  initial={motionInitial}
                  key={`heading-${view}`}
                  transition={motionTransition}
                >
                  {title && <h1 className="text-3xl font-semibold">{title}</h1>}
                  {message && <p className="text-muted-foreground">{message}</p>}
                </motion.div>
              </AnimatePresence>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                animate={motionAnimate}
                className="mx-auto flex w-full max-w-88 flex-col gap-0"
                exit={motionExit}
                initial={motionInitial}
                key={`content-${view}`}
                transition={motionTransition}
              >
                {content}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  )
}
