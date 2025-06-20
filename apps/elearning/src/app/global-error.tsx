'use client'

import { useCallback, useEffect, useMemo } from 'react'

import { type ErrorProps } from '@/components/layout/error-view'
import { Button } from '@/components/ui/button'
import { ServerErrorGraphic } from '@/components/ui/graphics/server-error'
import { useCookies } from '@/hooks/use-cookies'
import { type Locale } from '@/lib/i18n/types'
import { LOCALES } from '@/lib/i18n/utils'

const translations: Record<
  Locale,
  {
    title: string
    message: string
    retry: string
    reload: string
  }
> = {
  en: {
    title: 'Server Error',
    message: 'An unexpected error occurred',
    retry: 'Retry',
    reload: 'Reload',
  },
  es: {
    title: 'Error del servidor',
    message: 'Ocurrió un error inesperado',
    retry: 'Reintentar',
    reload: 'Recargar',
  },
  it: {
    title: 'Errore di server',
    message: 'Si è verificato un errore imprevisto',
    retry: 'Riprova',
    reload: 'Ricarica',
  },
}

export default ({ error, reset }: ErrorProps) => {
  const { readCookie } = useCookies()

  const locale = useMemo(() => {
    const cookieLocale = readCookie('NEXT_LOCALE') as Locale
    if (!cookieLocale || !LOCALES.includes(cookieLocale)) return 'en'
    return cookieLocale
  }, [readCookie])

  const t = useMemo(() => translations[locale], [locale])

  useEffect(() => {
    console.error(error)
  }, [error])

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
              <h2 className="mb-4 font-mono text-3xl font-bold tracking-tight text-foreground">{t.title}</h2>
              <p className="mb-8 font-mono text-lg text-foreground/75">{t.message}</p>
              <div className="flex justify-center gap-4">
                <Button onClick={reset} size="xl" variant="outline">
                  {t.retry}
                </Button>
                <Button onClick={reload} size="xl" variant="outline">
                  {t.reload}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
