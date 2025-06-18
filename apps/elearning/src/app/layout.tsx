import './globals.css'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { I18nProvider } from '@/components/providers/i18n-provider'
import { PathnameProvider } from '@/components/providers/pathname-provider'
import { ReactScan } from '@/components/providers/react-scan'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ProgressBarProvider } from '@/components/ui/progress-bar'
import { Toaster } from '@/components/ui/toaster'
import { Env } from '@/lib/env'
import { getLocale, getTranslations } from '@/lib/i18n/server'
import { generateLocalizedMetadata } from '@/lib/metadata'
import metadata from 'config/metadata.json'

export default async ({ children }: React.PropsWithChildren) => {
  const locale = await getLocale()
  const t = await getTranslations()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Page',
    name: metadata.name,
    description: t('App.description'),
    image: metadata.image,
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <I18nProvider>
          <ThemeProvider>
            <PathnameProvider>
              <ProgressBarProvider>
                {children}
                <Toaster />
                <Analytics />
                <SpeedInsights />
                {Env.DEV && <ReactScan />}
              </ProgressBarProvider>
            </PathnameProvider>
          </ThemeProvider>
        </I18nProvider>
        <script dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} type="application/ld+json" />
      </body>
    </html>
  )
}

export const generateMetadata = generateLocalizedMetadata({
  description: 'App.description',
})
