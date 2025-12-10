import './globals.css'

import Script from 'next/script'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import metadata from '@config/metadata'

import { I18nProvider } from '@/components/providers/i18n-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ProgressBarProvider } from '@/components/ui/progress-bar'
import { Toaster } from '@/components/ui/toaster'
import { publicAsset } from '@/lib/assets'
import { intlMetadata } from '@/lib/metadata'

export const generateMetadata = intlMetadata()

export default async ({ children }: LayoutProps<'/'>) => {
  const locale = await getLocale()
  const messages = await getMessages({ locale })
  const t = await getTranslations('Metadata')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Page',
    name: metadata.name,
    description: t('description'),
    image: publicAsset('open-graph.png'),
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NuqsAdapter>
          <I18nProvider locale={locale} messages={messages}>
            <ThemeProvider>
              <ProgressBarProvider>
                {children}
                <Toaster />
              </ProgressBarProvider>
            </ThemeProvider>
          </I18nProvider>
        </NuqsAdapter>
        <Analytics />
        <SpeedInsights />
        <Script id="jsonLd" type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </Script>
      </body>
    </html>
  )
}
