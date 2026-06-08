import './globals.css'

import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { getMessages, getTranslations } from 'next-intl/server'

import { getLocaleCookie } from '@/actions/cookies'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { I18nProvider } from '@/components/providers/i18n-context'
import { PWAContextProvider } from '@/components/providers/pwa-context'
import { SearchParamsProvider } from '@/components/providers/search-params-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { i18n } from '@/lib/i18n'
import { metadata } from '@/lib/metadata'
import { cn, publicFile } from '@/lib/utils'
import config from '~/config/metadata.json'

export { viewport } from '@/lib/metadata'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

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

const LayoutContent = async ({ children }: LayoutProps<'/'>) => {
  const locale = await getLocaleCookie()
  const messages = await getMessages({ locale })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Page',
    description: messages.Metadata.description,
    image: publicFile('/og-image.png'),
    name: config.name,
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={cn(geistSans.variable, geistMono.variable)} suppressHydrationWarning>
        <SearchParamsProvider>
          <I18nProvider value={{ locale, messages }}>
            <PWAContextProvider>
              <ThemeProvider>
                {children}
                <Toaster />
              </ThemeProvider>
            </PWAContextProvider>
          </I18nProvider>
        </SearchParamsProvider>
        {process.env.NODE_ENV === 'production' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
        <Script id="jsonLd" type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </Script>
      </body>
    </html>
  )
}

const LayoutFallback = () => (
  <html lang={i18n.defaultLocale}>
    <body>
      <LoadingFallback size="full" />
    </body>
  </html>
)

const Layout = (props: LayoutProps<'/'>) => (
  <Suspense fallback={<LayoutFallback />}>
    <LayoutContent {...props} />
  </Suspense>
)

export default Layout
