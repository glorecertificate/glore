import '@/app/globals.css'

import Script from 'next/script'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'

import metadata from '@config/metadata'
import theme from '@config/theme'

import { IntlProvider } from '@/components/providers/intl-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { intlMetadata } from '@/lib/metadata'
import { publicAsset } from '@/lib/storage'

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
        <IntlProvider locale={locale} messages={messages}>
          <ThemeProvider themes={Object.keys(theme.modes)}>
            {children}
            <Toaster />
          </ThemeProvider>
        </IntlProvider>
        <Analytics />
        <SpeedInsights />
        <Script id="jsonLd" type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </Script>
      </body>
    </html>
  )
}
