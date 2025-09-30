'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { ArrowRightIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import themeConfig from '@config/theme'
import { type Locale } from '@glore/i18n'
import { rgbRecord } from '@glore/utils/hex-to-rgb'
import { snakeToCamel } from '@glore/utils/string'
import { type Enum } from '@glore/utils/types'

import { EmailClientsFooter } from '@/components/features/auth/email-clients-footer'
import { LoginForm } from '@/components/features/auth/login-form'
import { PasswordRequestForm } from '@/components/features/auth/password-request-form'
import { PasswordResetForm } from '@/components/features/auth/password-reset-form'
import { Glore } from '@/components/icons/glore'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Globe, type GlobeColorOptions } from '@/components/ui/globe'
import { LanguageSelect } from '@/components/ui/language-select'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { useMetadata } from '@/hooks/use-metadata'
import { useNavigation } from '@/hooks/use-navigation'
import { useTheme } from '@/hooks/use-theme'
import { useTranslations } from '@/hooks/use-translations'
import { type AuthView } from '@/lib/navigation'
import { cookies } from '@/lib/storage'
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

export const AuthFlow = ({ token }: { token?: string | null }) => {
  const { searchParams } = useNavigation<{ lang: Locale }>()
  const { resolvedTheme } = useTheme()
  const t = useTranslations('Auth')

  const defaultView = useMemo<Enum<AuthView>>(
    () => (token === null ? 'invalid_token' : token ? 'password_reset' : 'login'),
    [token]
  )

  const { setTitleKey } = useMetadata({
    namespace: 'Auth',
    titleKey: snakeToCamel(`${defaultView}_title`),
    fullTitle: true,
    ogDescription: true,
  })

  const [view, setViewState] = useState<Enum<AuthView>>(defaultView)
  const [errored, setErrored] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  const title = useMemo(() => (view ? t.dynamic(snakeToCamel(`${view}_title`)) : null), [t, view])
  const message = useMemo(() => {
    if (!view) return null
    if (!(email && ['email_sent', 'password_updated'].includes(view))) return t.dynamic(snakeToCamel(`${view}_message`))
    return t(snakeToCamel(`${view}_message`), { email })
  }, [email, t, view])

  const setView = useCallback(
    (view: Enum<AuthView>) => {
      setViewState(view)
      setTitleKey(snakeToCamel(`${view}_meta_title`))
    },
    [setTitleKey]
  )

  const content = useMemo(() => {
    switch (view) {
      case 'login':
        return <LoginForm setErrored={setErrored} setView={setView} />
      case 'password_request':
        return <PasswordRequestForm setEmail={setEmail} setErrored={setErrored} setView={setView} />
      case 'email_sent':
        return <EmailClientsFooter />
      case 'password_reset':
        return <PasswordResetForm setEmail={setEmail} setErrored={setErrored} setView={setView} token={token} />
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
  }, [view, setView, token, t])

  useEffect(() => {
    searchParams.delete('lang')
    cookies.delete('login-token')
  }, [searchParams.delete, searchParams])

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
      case 'password_reset':
        return {
          ...options,
          baseColor: colors.neutral,
          markerColor: [colors.brand, colors.brandSecondary, colors.brandTertiary],
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

  //   const variants = {
  //     brand: {
  //       baseColor: colors.brand,
  //       markerColor: [colors.brand, colors.brandSecondary, colors.brandTertiary],
  //     },
  //     neutral: {
  //       baseColor: colors.neutral,
  //       markerColor: [colors.brand, colors.brandSecondary, colors.brandTertiary],
  //     },
  //     success: {
  //       baseColor: colors.success,
  //       markerColor: [colors.success],
  //     },
  //     destructive: {
  //       baseColor: colors.destructive,
  //       markerColor: [colors.destructive],
  //     },
  //     background: {
  //       baseColor: colors.background,
  //       markerColor: [colors.brand, colors.brandSecondary, colors.brandTertiary],
  //     },
  //   } satisfies Record<string, Pick<GlobeOptions, 'baseColor' | 'markerColor'>>

  //   return {
  //     glowColor: background,
  //     ...(errored ? variants.destructive : viewColors[view]),
  //   }
  // }, [errored, resolvedTheme, view])

  // const globeColorProps = useMemo(() => {
  //   const variants = globeColors(resolvedTheme)

  //   const viewColors = {
  //     login: variants.brand,
  //     password_request: variants.neutral,
  //     email_sent: variants.success,
  //     password_reset: variants.neutral,
  //     password_updated: variants.success,
  //     invalid_token: variants.destructive,
  //     invalid_password_reset: variants.destructive,
  //   }

  //   return {
  //     glowColor: background,
  //     ...(errored ? variants.destructive : viewColors[view]),
  //   }
  // }, [errored, resolvedTheme, view])

  return (
    <div className="flex h-full min-h-[100vh] flex-col gap-4 p-6 md:p-10">
      <div className="flex justify-between gap-2">
        <div title={view === 'login' ? undefined : t('goToLogin')}>
          <Glore
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
      <div className="flex justify-end">
        <ThemeSwitch className="text-sm" tooltip={{ arrow: false, side: 'top' }} />
      </div>
    </div>
  )
}
