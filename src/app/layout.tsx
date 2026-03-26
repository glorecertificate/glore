import './globals.css'

import Script from 'next/script'
import { Suspense } from 'react'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { getMessages, getTranslations } from 'next-intl/server'

import { getLocaleCookie } from '@/actions/cookies'
import { InstallBanner } from '@/components/features/pwa/install-banner'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { I18nProvider } from '@/components/providers/i18n-context'
import { PWAContextProvider } from '@/components/providers/pwa-context'
import { SearchParamsProvider } from '@/components/providers/search-params-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { i18n } from '@/lib/i18n'
import { metadata } from '@/lib/metadata'
import { publicFile } from '@/lib/utils'
import config from '~/config/metadata.json'

export { viewport } from '@/lib/metadata'

export const generateMetadata = async () => {
  const t = await getTranslations('Metadata')

  return {
    ...metadata,
    description: t('description'),
    keywords: t('keywords'),
    title: {
      default: config.name,
      template: `%s ${config.separator} ${config.name}`,
    },
  }
}

const Layout = async ({ children }: LayoutProps<'/'>) => {
  const t = await getTranslations('Metadata')
  const locale = await getLocaleCookie()
  const messages = await getMessages({ locale })
  const i18nContextValue = Object.freeze({ locale, messages })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Page',
    description: t('description'),
    image: publicFile('/og-image.png'),
    name: config.name,
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SearchParamsProvider>
          <I18nProvider value={i18nContextValue}>
            <PWAContextProvider>
              <ThemeProvider>
                {children}
                <InstallBanner />
                <Toaster />
              </ThemeProvider>
            </PWAContextProvider>
          </I18nProvider>
        </SearchParamsProvider>
        <Analytics debug={false} />
        <SpeedInsights debug={false} />
        <Script id="jsonLd" type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </Script>
      </body>
    </html>
  )
}

const fallback = (
  <html lang={i18n.defaultLocale}>
    <body>
      <LoadingFallback size="full" />
    </body>
  </html>
)

export default (props: LayoutProps<'/'>) => (
  <Suspense fallback={fallback}>
    <Layout {...props} />
  </Suspense>
)
