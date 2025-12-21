import './globals.css'

import { Suspense } from 'react'
import Script from 'next/script'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { getMessages, getTranslations } from 'next-intl/server'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import config from '@static/config'
import { getLocaleCookie } from '@/actions/cookies'
import { I18nProvider } from '@/components/providers/i18n-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ProgressBarProvider } from '@/components/ui/progress-bar'
import { Toaster } from '@/components/ui/toaster'
import { i18n } from '@/lib/i18n'
import { intlMetadata } from '@/lib/metadata'
import { publicAsset } from '@/lib/storage'

export const generateMetadata = () => intlMetadata()

const RootLayout = async ({ children }: LayoutProps<'/'>) => {
  const locale = await getLocaleCookie()
  const messages = await getMessages({ locale })
  const t = await getTranslations('Metadata')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Page',
    name: config.metadata.name,
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

export default async (props: LayoutProps<'/'>) => (
  <Suspense
    fallback={
      <html lang={i18n.defaultLocale}>
        <body />
      </html>
    }
  >
    <RootLayout {...props} />
  </Suspense>
)
