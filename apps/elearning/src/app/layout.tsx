import './globals.css'

import Script from 'next/script'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

import meta from '@config/metadata'
import theme from '@config/theme'
import { I18nProvider } from '@repo/i18n/provider'
import { ProgressBarProvider } from '@repo/ui/components/progress-bar'
import { ThemeProvider } from '@repo/ui/components/theme-provider'
import { Toaster } from '@repo/ui/components/toaster'

import { NavigationProvider } from '@/components/providers/navigation-provider'
import { getLocale, getMessages, getTranslations } from '@/lib/i18n'
import { createMetadata } from '@/lib/metadata'
import { Public } from '@/lib/storage'

export const generateMetadata = createMetadata({
  description: 'App.description',
})

export default async ({ children }: LayoutProps<'/'>) => {
  const locale = await getLocale()
  const messages = await getMessages(locale)
  const t = await getTranslations('App')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Page',
    name: meta.name,
    description: t('description'),
    image: Public.OpenGraph,
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <I18nProvider cookie="NEXT_LOCALE" locale={locale} messages={messages}>
          <ThemeProvider themes={Object.keys(theme.modes)}>
            <NavigationProvider>
              <ProgressBarProvider>
                {children}
                <Toaster />
                <Analytics />
                <SpeedInsights />
              </ProgressBarProvider>
            </NavigationProvider>
          </ThemeProvider>
        </I18nProvider>
        <Script id="jsonLd" type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </Script>
      </body>
    </html>
  )
}
