import './globals.css'

import { Suspense } from 'react'
import Script from 'next/script'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { getMessages, getTranslations } from 'next-intl/server'

import config from '~/config/metadata.json'

import { getLocaleCookie } from '@/actions/cookies'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { I18nProvider } from '@/components/providers/i18n-provider'
import { SearchParamsProvider } from '@/components/providers/search-params-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { i18n } from '@/lib/i18n'
import { metadata } from '@/lib/metadata'
import { publicFile } from '@/lib/storage'

export { viewport } from '@/lib/metadata'

export const generateMetadata = async () => {
  const t = await getTranslations('Metadata')

  return {
    ...metadata,
    title: {
      default: config.name,
      template: `%s ${config.separator} ${config.name}`,
    },
    description: t('description'),
    keywords: t('keywords'),
  }
}

const Layout = async ({ children }: LayoutProps<'/'>) => {
  const locale = await getLocaleCookie()
  const messages = await getMessages({ locale })
  const t = await getTranslations('Metadata')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Page',
    name: config.name,
    description: t('description'),
    image: publicFile('/og-image.png'),
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SearchParamsProvider>
          <I18nProvider value={{ locale, messages }}>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
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

export default async (props: LayoutProps<'/'>) => (
  <Suspense
    fallback={
      <html lang={i18n.defaultLocale}>
        <body>
          <LoadingFallback size="full" />
        </body>
      </html>
    }
  >
    <Layout {...props} />
  </Suspense>
)
