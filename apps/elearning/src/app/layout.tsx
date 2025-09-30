import './globals.css'

import Script from 'next/script'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

import metadata from '@config/metadata'
import theme from '@config/theme'

import { I18nProvider } from '@/components/providers/i18n-provider'
import { NavigationProvider } from '@/components/providers/navigation-provider'
import { ProgressBarProvider } from '@/components/ui/progress-bar'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { PublicAsset } from '@/lib/assets'
import { getLocale, getTranslations } from '@/lib/i18n'
import { createMetadata } from '@/lib/metadata'
import { getMessages } from '@glore/i18n'

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
    name: metadata.name,
    description: t('description'),
    image: PublicAsset.OpenGraph,
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <I18nProvider locale={locale} messages={messages}>
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
