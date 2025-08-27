import './globals.css'

import Script from 'next/script'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { I18nProvider } from '@/components/providers/i18n-provider'
import { PathnameProvider } from '@/components/providers/pathname-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ProgressBarProvider } from '@/components/ui/progress-bar'
import { Toaster } from '@/components/ui/toaster'
import { getLocale, getMessages, getTranslations } from '@/lib/i18n/server'
import { createMetadata } from '@/lib/metadata'
import { Asset } from '@/lib/storage/types'
import { asset } from '@/lib/storage/utils'
import meta from 'config/metadata.json'

export const generateMetadata = createMetadata({
  description: 'App.description',
})

export default async ({ children }: React.PropsWithChildren) => {
  const locale = await getLocale()
  const messages = await getMessages(locale)
  const t = await getTranslations('App')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Page',
    name: meta.name,
    description: t('description'),
    image: asset(Asset.OpenGraph),
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <I18nProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <PathnameProvider>
              <ProgressBarProvider>
                {children}
                <Toaster />
                <Analytics />
                <SpeedInsights />
              </ProgressBarProvider>
            </PathnameProvider>
          </ThemeProvider>
        </I18nProvider>
        <Script id="jsonLd" type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </Script>
      </body>
    </html>
  )
}
