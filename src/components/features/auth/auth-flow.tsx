'use client'

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { ArrowRightIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslations } from 'next-intl'

import { theme } from '@config/app'
import { EmailProviderActions } from '@/components/features/auth/email-provider-actions'
import { LoginForm } from '@/components/features/auth/login-form'
import { PasswordRequestForm } from '@/components/features/auth/password-request-form'
import { PasswordResetForm } from '@/components/features/auth/password-reset-form'
import { ResendEmailButton } from '@/components/features/auth/resend-email-button'
import { GloreLogo } from '@/components/icons/_glore-logo'
import { Button } from '@/components/ui/button'
import { Globe, type GlobeColorOptions } from '@/components/ui/globe'
import { LanguageSelect } from '@/components/ui/language-select'
import { useMetadata } from '@/hooks/use-metadata'
import { useTheme } from '@/hooks/use-theme'
import { EMAIL_REGEX } from '@/lib/constants'
import { type Enum } from '@/lib/types'
import { camelize, cn, hexToRgb } from '@/lib/utils'

export enum AuthView {
  Login = 'login',
  PasswordRequest = 'password_request',
  EmailSent = 'email_sent',
  PasswordReset = 'password_reset',
  PasswordUpdated = 'password_updated',
  InvalidToken = 'invalid_token',
  InvalidPasswordReset = 'invalid_password_reset',
}

export const AuthFlow = ({
  resetToken,
  ...value
}: {
  resetToken: string | null
  username?: string
  view: Enum<AuthView>
}) => {
  const t = useTranslations('Auth')
  const { resolvedTheme } = useTheme()

  const [view, setView] = useState(value.view)
  const [username, setUsername] = useState(value.username)
  const [errored, setErrored] = useState(false)

  useMetadata({
    applicationName: view === 'login' ? false : 'full',
    title: t(camelize(`${view}_meta_title`)),
  })

  const title = view ? t(camelize(`${view}_title`)) : null

  const message = useMemo(() => {
    if (!view) return null
    if (view !== 'email_sent') return t(camelize(`${view}_message`))
    return t.rich('emailSentMessage', {
      email: () =>
        username && EMAIL_REGEX.test(username) ? <span className="text-brand">{` ${username} `}</span> : null,
    })
  }, [username, t, view])

  const content = useMemo(() => {
    switch (view) {
      case 'login':
        return <LoginForm setErrored={setErrored} setUsername={setUsername} setView={setView} username={username} />
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
  }, [t, username, view, resetToken])

  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number>()

  const updateHeight = useCallback((element: HTMLDivElement) => {
    const height = element.getBoundingClientRect().height
    if (height === 0) return
    setHeight(height)
  }, [])

  useLayoutEffect(() => {
    if (view !== 'login') return

    const element = ref.current
    if (!element) return
    updateHeight(element)

    const ro = new ResizeObserver(() => updateHeight(element))
    ro.observe(element)
    return () => ro.disconnect()
  }, [view, updateHeight])

  const containerStyle = useMemo(() => (height ? { minHeight: height } : {}), [height])

  const globeColorOptions = useMemo<GlobeColorOptions>(() => {
    const colors = hexToRgb(theme.colors[resolvedTheme ?? 'light'])
    const options = { glowColor: colors.background } as GlobeColorOptions

    if (errored || view === 'invalid_token' || view === 'invalid_password_reset')
      return {
        ...options,
        baseColor: colors.destructive,
        markerColor: colors.destructive,
      }

    switch (view) {
      case 'login':
        return {
          ...options,
          baseColor: colors.brand,
          markerColor: [colors.brand, colors.brandSecondary, colors.brandTertiary],
        }
      case 'password_request':
        return {
          ...options,
          baseColor: colors.neutral,
          markerColor: [colors.brand, colors.brandSecondary, colors.brandTertiary],
        }
      case 'password_reset':
        return {
          ...options,
          baseColor: colors.warning,
          markerColor: [colors.warning],
        }
      case 'password_updated':
      case 'email_sent':
        return {
          ...options,
          baseColor: colors.success,
          markerColor: [colors.success],
        }
      default:
        return options
    }
  }, [errored, resolvedTheme, view])

  return (
    <>
      <div className="flex justify-between gap-2">
        <div title={view === 'login' ? undefined : t('goToLogin')}>
          <GloreLogo
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
              <Globe
                className="mx-auto size-56"
                offset={[36, -32]}
                scale={1.3}
                transitionDuration={200}
                {...globeColorOptions}
              />
              <AnimatePresence mode="wait">
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-2 text-center"
                  exit={{ opacity: 0, y: -8 }}
                  initial={{ opacity: 0, y: 8 }}
                  key={`heading-${view}`}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {title && <h1 className="font-bold text-3xl">{title}</h1>}
                  {message && <p className="text-muted-foreground">{message}</p>}
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
                transition={{ duration: 0.2, ease: 'easeOut' }}
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
