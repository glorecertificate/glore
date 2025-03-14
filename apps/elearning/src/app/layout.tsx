import './globals.css'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { AppProvider } from '@/components/app-provider'
import { metadata } from '@/lib/metadata'
import { getLocale, getTranslations } from '@/services/i18n'
import app from 'static/app.json'

export default async ({ children }: React.PropsWithChildren) => {
  const [locale] = await getLocale()
  const t = await getTranslations()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Page',
    name: app.name,
    description: t('App.description'),
    image: app.image,
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <AppProvider>
          {children}
          <Analytics />
          <SpeedInsights />
        </AppProvider>
        <script dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} type="application/ld+json" />
      </body>
    </html>
  )
}

export const generateMetadata = metadata({
  description: 'App.description',
})
