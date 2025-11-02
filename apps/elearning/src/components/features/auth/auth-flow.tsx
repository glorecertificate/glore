'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { ArrowRightIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslations } from 'next-intl'

import themeConfig from '@config/theme'
import { rgbRecord } from '@glore/utils/hex-to-rgb'
import { snakeToCamel } from '@glore/utils/string'
import { type Enum } from '@glore/utils/types'

import { EmailClientsFooter } from '@/components/features/auth/email-clients-footer'
import { LoginForm } from '@/components/features/auth/login-form'
import { PasswordRequestForm } from '@/components/features/auth/password-request-form'
import { PasswordResetForm } from '@/components/features/auth/password-reset-form'
import { GloreIcon } from '@/components/icons/glore'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Globe, type GlobeColorOptions } from '@/components/ui/globe'
import { LanguageSelect } from '@/components/ui/language-select'
import { useMetadata } from '@/hooks/use-metadata'
import { useSearchParams } from '@/hooks/use-search-params'
import { useTheme } from '@/hooks/use-theme'
import { EMAIL_REGEX } from '@/lib/constants'
import { type AuthView } from '@/lib/navigation'
import { cn } from '@/lib/utils'

const themeColors = {
  light: rgbRecord(themeConfig.colors.light),
  dark: rgbRecord(themeConfig.colors.dark),
}

const AuthActionButton = ({ children, ...props }: ButtonProps) => (
  <Button
    className="mx-auto justify-center"
    effect="expandIcon"
    icon={ArrowRightIcon}
    iconPlacement="right"
    size="lg"
    variant="outline"
    {...props}
  >
    {children}
  </Button>
)

interface AuthFlowProps {
  defaultUsername?: string
  defaultView: Enum<AuthView>
  token?: string
}

export const AuthFlow = ({ defaultUsername, defaultView, token }: AuthFlowProps) => {
  const searchParams = useSearchParams()
  const { resolvedTheme } = useTheme()
  const t = useTranslations('Auth')

  const { setTitleKey } = useMetadata({
    namespace: 'Auth',
    titleKey: snakeToCamel(`${defaultView}_title`),
    fullTitle: true,
    ogDescription: true,
  })

  const [view, setView] = useState(defaultView)
  const [errored, setErrored] = useState(false)
  const [username, setUsername] = useState(defaultUsername)

  const title = view ? t(snakeToCamel(`${view}_title`)) : null

  const message = useMemo(() => {
    if (!view) return null
    if (view !== 'email_sent') return t(snakeToCamel(`${view}_message`))
    return t.rich('emailSentMessage', {
      email: () =>
        username && EMAIL_REGEX.test(username) ? <span className="font-semibold">{` ${username} `}</span> : null,
    })
  }, [username, t, view])

  const content = useMemo(() => {
    switch (view) {
      case 'login':
        return (
          <LoginForm defaultUsername={username} setErrored={setErrored} setUsername={setUsername} setView={setView} />
        )
      case 'password_request':
        return (
          <PasswordRequestForm
            defaultUsername={username}
            setErrored={setErrored}
            setUsername={setUsername}
            setView={setView}
          />
        )
      case 'email_sent':
        return <EmailClientsFooter />
      case 'password_reset':
        return <PasswordResetForm setErrored={setErrored} setView={setView} token={token} />
      case 'password_updated':
        return <AuthActionButton onClick={() => setView('login')}>{t('passwordUpdatedAction')}</AuthActionButton>
      case 'invalid_token':
        return (
          <AuthActionButton onClick={() => setView('password_request')}>{t('invalidTokenAction')}</AuthActionButton>
        )
      case 'invalid_password_reset':
        return (
          <AuthActionButton onClick={() => setView('password_request')}>
            {t('invalidPasswordResetAction')}
          </AuthActionButton>
        )
      default:
        return null
    }
  }, [t, token, username, view])

  // biome-ignore lint: exhaustive-deps
  useEffect(() => {
    if (defaultView === 'invalid_token' && searchParams.has('resetToken')) {
      searchParams.delete('resetToken')
    }
  }, [])

  useEffect(() => {
    setTitleKey(snakeToCamel(`${view}_meta_title`))
  }, [setTitleKey, view])

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
    const colors = themeColors[resolvedTheme ?? 'light']
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
          <GloreIcon
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
          <div className="flex min-h-[550px] flex-col gap-8" ref={ref} style={containerStyle}>
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
                className="mx-auto flex w-full max-w-[352px] flex-col gap-0"
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
