'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo } from 'react'

import { useTranslations } from 'next-intl'

import { hasHistory } from '@glore/utils/has-history'
import { type AnyError } from '@glore/utils/types'

import { ServerErrorGraphic } from '@/components/graphics/server-error'
import { IntlProvider } from '@/components/providers/intl-provider'
import { Button } from '@/components/ui/button'
import { useCookies } from '@/hooks/use-cookies'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/intl'

const GlobalErrorView = () => {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('Errors.server')

  const onBackClick = useCallback(() => {
    router.back()
  }, [router])

  const reloadPage = useCallback(() => {
    window.location.reload()
  }, [])

  const goToHome = useCallback(() => {
    router.push('/')
  }, [router])

  return (
    <div className="relative flex w-full grow flex-col items-center justify-center gap-6">
      <ServerErrorGraphic width={240} />
      <div className="text-center">
        <h2 className="mb-4 font-bold font-mono text-2xl text-foreground tracking-tight">{t('title')}</h2>
        <p className="mb-8 font-mono text-foreground/75">{t('message')}</p>
        <div className="flex justify-center gap-4">
          {hasHistory() ? (
            <Button onClick={onBackClick} size="lg" variant="outline">
              {t('backToPrevious')}
            </Button>
          ) : (
            pathname !== '/' && (
              <Button onClick={goToHome} size="lg" variant="outline">
                {t('backToHome')}
              </Button>
            )
          )}
          <Button onClick={reloadPage} size="lg" variant="outline">
            {t('refreshPage')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ({ error }: { error: AnyError }) => {
  const cookies = useCookies()

  const locale = useMemo(() => {
    const cookieLocale = cookies.get('NEXT_LOCALE')
    if (cookieLocale && !LOCALES.includes(cookieLocale)) return cookieLocale
    return DEFAULT_LOCALE
  }, [cookies])

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang={locale}>
      <body>
        <IntlProvider locale={locale}>
          <div className="flex min-h-screen flex-col items-center bg-background px-4 py-12 text-center">
            <GlobalErrorView />
          </div>
        </IntlProvider>
      </body>
    </html>
  )
}
