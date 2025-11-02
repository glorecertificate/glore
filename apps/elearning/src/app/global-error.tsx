'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { createTranslator } from 'next-intl'

import { type AnyError } from '@glore/utils/types'

import { ErrorIllustration } from '@/components/illustrations/error'
import { Button } from '@/components/ui/button'
import { useCookies } from '@/hooks/use-cookies'
import { DEFAULT_LOCALE, type Translator } from '@/lib/intl'

export default ({ error }: { error: AnyError }) => {
  const cookies = useCookies()
  const pathname = usePathname()
  const router = useRouter()

  const [t, setT] = useState<Translator<'Errors'> | undefined>(undefined)
  const locale = cookies.get('NEXT_LOCALE', { prefix: false }) ?? DEFAULT_LOCALE

  useEffect(() => {
    void (async () => {
      const messages = (await import(`../../config/translations/${locale}.json`)).default
      setT(createTranslator({ locale, namespace: 'Errors', messages }))
    })()
  })

  const hasHistory =
    !!document.referrer &&
    document.referrer.startsWith(window.location.origin) &&
    document.referrer !== window.location.href

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang={locale}>
      <body>
        {t && (
          <main className="flex min-h-screen flex-col items-center bg-background px-4 py-12 text-center">
            <div className="relative flex w-full grow flex-col items-center justify-center gap-6">
              <ErrorIllustration width={240} />
              <div className="text-center">
                <h2 className="mb-4 font-bold font-mono text-2xl text-foreground tracking-tight">{t('title')}</h2>
                <p className="mb-8 font-mono text-foreground/75">{t('message')}</p>
                <div className="flex justify-center gap-4">
                  <Button onClick={() => window.location.reload()} size="lg" variant="outline">
                    {t('refreshPage')}
                  </Button>
                  {hasHistory ? (
                    <Button onClick={() => router.back()} size="lg" variant="outline">
                      {t('backToPrevious')}
                    </Button>
                  ) : (
                    pathname !== '/' && (
                      <Button onClick={() => router.push('/')} size="lg" variant="outline">
                        {t('backToHome')}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          </main>
        )}
      </body>
    </html>
  )
}
