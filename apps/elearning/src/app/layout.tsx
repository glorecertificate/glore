import './globals.css'

import Script from 'next/script'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { ReactScan } from '@/components/internal/react-scan'
import { SupabaseWidget } from '@/components/internal/supabase-widget'
import { I18nProvider } from '@/components/providers/i18n-provider'
import { PathnameProvider } from '@/components/providers/pathname-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ProgressBarProvider } from '@/components/ui/progress-bar'
import { Toaster } from '@/components/ui/toaster'
import { Env } from '@/lib/env'
import { getLocale, getTranslations } from '@/lib/i18n/server'
import { generatePageMetadata } from '@/lib/metadata'
import { asset, Asset } from '@/lib/storage'
import meta from 'config/metadata.json'

export const generateMetadata = generatePageMetadata({
  description: 'App.description',
})

export default async ({ children }: React.PropsWithChildren) => {
  const locale = await getLocale()
  const t = await getTranslations()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Page',
    name: meta.name,
    description: t('App.description'),
    image: asset(Asset.OpenGraph),
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <I18nProvider>
          <ThemeProvider>
            <PathnameProvider>
              <ProgressBarProvider>
                {children}
                <Toaster />
                <Analytics />
                <SpeedInsights />
                {Env.DEV_MODE && (
                  <>
                    <ReactScan />
                    <SupabaseWidget />
                  </>
                )}
              </ProgressBarProvider>
            </PathnameProvider>
          </ThemeProvider>
        </I18nProvider>
        <Script id="jsonLd" type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </Script>
      </body>
    </html>
  )
}
