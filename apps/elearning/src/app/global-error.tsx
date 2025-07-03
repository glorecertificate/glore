'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo } from 'react'

import { type ErrorProps } from '@/components/layout/error-view'
import { Button } from '@/components/ui/button'
import { ServerErrorGraphic } from '@/components/ui/graphics/server-error'
import { useCookies } from '@/hooks/use-cookies'
import { type Locale } from '@/lib/i18n/types'
import { LOCALES, localizeJson } from '@/lib/i18n/utils'
import { Route } from '@/lib/navigation'
import { defaultLocale } from 'config/app.json'
import { backToHome, backToPrevious, message, refreshPage, title } from 'config/translations/static/errors.json'

export default ({ error }: ErrorProps) => {
  const { readCookie } = useCookies()
  const pathname = usePathname()
  const router = useRouter()

  const locale = useMemo(() => {
    const cookieLocale = readCookie('NEXT_LOCALE') as Locale
    if (!cookieLocale || !LOCALES.includes(cookieLocale)) return defaultLocale as Locale
    return cookieLocale
  }, [readCookie])

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

  const reloadPage = useCallback(() => {
    window.location.reload()
  }, [])

  const goToHome = useCallback(() => {
    router.push(Route.Home)
  }, [router])

  return (
    <html lang={locale}>
      <body>
        <div className="flex min-h-[100vh] flex-col items-center bg-background px-4 py-12 text-center">
          <div className="relative flex w-full grow flex-col items-center justify-center gap-6">
            <ServerErrorGraphic width={240} />
            <div className="text-center">
              <h2 className="mb-4 font-mono text-3xl font-bold tracking-tight text-foreground">
                {localizeJson(title, locale)}
              </h2>
              <p className="mb-8 font-mono text-lg text-foreground/75">{localizeJson(message, locale)}</p>
              <div className="flex justify-center gap-4">
                {canGoBack ? (
                  <Button onClick={onBackClick} size="lg" variant="outline">
                    {localizeJson(backToPrevious, locale)}
                  </Button>
                ) : (
                  pathname !== '/' && (
                    <Button onClick={goToHome} size="lg" variant="outline">
                      {localizeJson(backToHome, locale)}
                    </Button>
                  )
                )}
                <Button onClick={reloadPage} size="lg" variant="outline">
                  {localizeJson(refreshPage, locale)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
