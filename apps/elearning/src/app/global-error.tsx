'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo } from 'react'

import { i18n } from '@glore/i18n'
import { hasHistory } from '@glore/utils/has-history'
import { type AnyError } from '@glore/utils/types'

import { ServerErrorGraphic } from '@/components/graphics/server-error'
import { I18nProvider } from '@/components/providers/i18n-provider'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/hooks/use-translations'
import { cookies } from '@/lib/storage'

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
  const locale = useMemo(() => {
    const cookieLocale = cookies.get('NEXT_LOCALE')
    if (cookieLocale && !i18n.locales.includes(cookieLocale)) return cookieLocale
    return i18n.defaultLocale
  }, [])

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale}>
          <div className="flex min-h-[100vh] flex-col items-center bg-background px-4 py-12 text-center">
            <GlobalErrorView />
          </div>
        </I18nProvider>
      </body>
    </html>
  )
}
