'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo } from 'react'

import { type ErrorProps } from '@/components/layout/error-view'
import { Button } from '@/components/ui/button'
import { ServerErrorGraphic } from '@/components/ui/graphics/server-error'
import { useCookies } from '@/hooks/use-cookies'
import { usePathname } from '@/hooks/use-pathname'
import { type Locale } from '@/lib/i18n/types'
import { LOCALES } from '@/lib/i18n/utils'
import { Route } from '@/lib/navigation'
import en from 'static/translations/en.json'
import es from 'static/translations/es.json'
import it from 'static/translations/it.json'

export default ({ error }: ErrorProps) => {
  const { readCookie } = useCookies()
  const { pathname } = usePathname()
  const router = useRouter()

  const locale = useMemo(() => {
    const cookieLocale = readCookie('NEXT_LOCALE') as Locale
    if (!cookieLocale || !LOCALES.includes(cookieLocale)) return 'en'
    return cookieLocale
  }, [readCookie])

  const t = useMemo(() => {
    const translations = { en, es, it }
    return translations[locale]
  }, [locale])

  useEffect(() => {
    console.error(error)
  }, [error])

  const canGoBack = useMemo(() => {
    const previousUrl = document.referrer
    return previousUrl && previousUrl.startsWith(window.location.origin) && previousUrl !== window.location.href
  }, [])

  const onBackClick = useCallback(() => {
    router.back()
  }, [router])

  const reload = useCallback(() => {
    window.location.reload()
  }, [])

  return (
    <html lang={locale}>
      <body>
        <div className="flex min-h-[100vh] flex-col items-center bg-background px-4 py-12 text-center">
          <div className="relative flex w-full grow flex-col items-center justify-center gap-6">
            <ServerErrorGraphic width={240} />
            <div className="text-center">
              <h2 className="mb-4 font-mono text-3xl font-bold tracking-tight text-foreground">
                {t.Common.errorTitle}
              </h2>
              <p className="mb-8 font-mono text-lg text-foreground/75">{t.Common.errorMessage}</p>
              <div className="flex justify-center gap-4">
                {canGoBack ? (
                  <Button onClick={onBackClick} size="xl" variant="outline">
                    {t.Common.backToPrevious}
                  </Button>
                ) : (
                  pathname !== Route.Home && (
                    <Button asChild size="xl" variant="outline">
                      {t.Common.backToHome}
                    </Button>
                  )
                )}
                <Button onClick={reload} size="xl" variant="outline">
                  {t.Common.refreshPage}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
