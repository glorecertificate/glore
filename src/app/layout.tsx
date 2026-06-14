import './globals.css'

import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { getMessages, getTranslations } from 'next-intl/server'

import { getLocaleCookie } from '@/actions/cookies'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { I18nProvider } from '@/components/providers/i18n'
import { SearchParamsProvider } from '@/components/providers/search-params'
import { ThemeProvider } from '@/components/providers/theme'
import { Toaster } from '@/components/ui/toaster'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import { APP_NAME, APP_SEPARATOR, metadata } from '@/lib/metadata'
import { cn, publicFile } from '@/lib/utils'

export const generateMetadata = async () => {
  const t = await getTranslations('Metadata')

  return {
    ...metadata,
    description: t('description'),
    keywords: t('keywords'),
    title: {
      default: APP_NAME,
      template: `%s ${APP_SEPARATOR} ${APP_NAME}`,
    },
  }
}

export { viewport } from '@/lib/metadata'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

const AppLayoutContent = async ({ children }: LayoutProps<'/'>) => {
  const locale = await getLocaleCookie()
  const messages = await getMessages({ locale })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Page',
    name: messages.Metadata.title,
    description: messages.Metadata.description,
    image: publicFile('/og-image.png'),
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={cn(geistSans.variable, geistMono.variable)} suppressHydrationWarning>
        <SearchParamsProvider>
          <I18nProvider locale={locale} messages={messages}>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
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

const AppLayoutFallback = () => (
  <html lang={DEFAULT_LOCALE}>
    <body>
      <LoadingFallback size="full" />
    </body>
  </html>
)

const AppLayout = (props: LayoutProps<'/'>) => (
  <Suspense fallback={<AppLayoutFallback />}>
    <AppLayoutContent {...props} />
  </Suspense>
)

export default AppLayout
