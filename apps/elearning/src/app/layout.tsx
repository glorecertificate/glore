import '@/app/globals.css'

import Script from 'next/script'
import { Suspense, use } from 'react'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'

import metadata from '@config/metadata'
import theme from '@config/theme'

import { IntlProvider } from '@/components/providers/intl-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ProgressBarProvider } from '@/components/ui/progress-bar'
import { Toaster } from '@/components/ui/toaster'
import { intlMetadata } from '@/lib/metadata'
import { publicAsset } from '@/lib/storage'

export const generateMetadata = intlMetadata()

const resolveRootLayoutData = async () => {
  const locale = await getLocale()
  const [messages, t] = await Promise.all([getMessages({ locale }), getTranslations('Metadata')])
  return { locale, messages, t }
}

const RootLayoutContent = ({ children }: LayoutProps<'/'>) => {
  const { locale, messages, t } = use(resolveRootLayoutData())

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
            <ProgressBarProvider>
              {children}
              <Toaster />
              <Analytics />
              <SpeedInsights />
            </ProgressBarProvider>
          </ThemeProvider>
        </IntlProvider>
        <Script id="jsonLd" type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </Script>
      </body>
    </html>
  )
}

export default (props: LayoutProps<'/'>) => (
  <Suspense fallback={null}>
    <RootLayoutContent {...props} />
  </Suspense>
)
