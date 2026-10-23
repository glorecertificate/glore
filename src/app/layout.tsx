import './globals.css'

import { Bricolage_Grotesque, Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { getMessages, getTranslations } from 'next-intl/server'

import { getLocaleCookie } from '@/actions/cookies'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { PwaInstallPrompt } from '@/components/layout/pwa-install-prompt'
import { I18nProvider } from '@/components/providers/i18n'
import { MotionProvider } from '@/components/providers/motion'
import { SearchParamsProvider } from '@/components/providers/search-params'
import { ThemeProvider } from '@/components/providers/theme'
import { Toaster } from '@/components/ui/toaster'
import { DEFAULT_LOCALE, clientMessages } from '@/lib/i18n'
import { APP_NAME, appTitle, metadata } from '@/lib/metadata'
import { cn, publicFile, serializeJsonLd } from '@/lib/utils'

export const generateMetadata = async () => {
  const t = await getTranslations('Metadata')

  return {
    ...metadata,
    description: t('description'),
    keywords: t('keywords'),
    title: {
      default: APP_NAME,
      template: appTitle('%s'),
    },
  }
}

export { viewport } from '@/lib/metadata'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

const AppLayoutContent = async ({ children }: LayoutProps<'/'>) => {
  const locale = (await getLocaleCookie()) ?? DEFAULT_LOCALE
  const messages = await getMessages({ locale })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Page',
    name: messages.Metadata.title,
    description: messages.Metadata.description,
    image: publicFile('/og-image.png'),
  }

  return (
    <html
      className={cn(geistSans.variable, bricolage.variable, geistMono.variable)}
      lang={locale}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <SearchParamsProvider>
          <I18nProvider locale={locale} messages={clientMessages(messages)}>
            <ThemeProvider>
              <MotionProvider>
                {children}
                <Toaster />
                <PwaInstallPrompt />
              </MotionProvider>
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
          {serializeJsonLd(jsonLd)}
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
