'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo } from 'react'

import { type Locale } from 'use-intl'

import { hasHistory, log } from '@repo/utils'

import { type ErrorProps } from '@/components/layout/error-view'
import { Button } from '@/components/ui/button'
import { ServerErrorGraphic } from '@/components/ui/graphics/server-error'
import { LOCALES } from '@/lib/i18n/config'
import { localize } from '@/lib/i18n/utils'
import { Route } from '@/lib/navigation'
import { cookies } from '@/lib/storage/client'
import config from 'config/app.json'
import errors from 'config/translations/static/errors.json'

export default ({ error }: ErrorProps) => {
  const pathname = usePathname()
  const router = useRouter()

  const locale = useMemo(() => {
    const cookieLocale = cookies.get('NEXT_LOCALE')
    if (!cookieLocale || !LOCALES.includes(cookieLocale)) return config.defaultLocale as Locale
    return cookieLocale
  }, [])

  useEffect(() => {
    log.error(error)
  }, [error])

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
              <h2 className="mb-4 font-mono text-2xl font-bold tracking-tight text-foreground">
                {localize(errors.title, locale)}
              </h2>
              <p className="mb-8 font-mono text-foreground/75">{localize(errors.message, locale)}</p>
              <div className="flex justify-center gap-4">
                {hasHistory() ? (
                  <Button onClick={onBackClick} size="lg" variant="outline">
                    {localize(errors.backToPrevious, locale)}
                  </Button>
                ) : (
                  pathname !== '/' && (
                    <Button onClick={goToHome} size="lg" variant="outline">
                      {localize(errors.backToHome, locale)}
                    </Button>
                  )
                )}
                <Button onClick={reloadPage} size="lg" variant="outline">
                  {localize(errors.refreshPage, locale)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
