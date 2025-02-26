import './globals.css'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { I18nProvider } from '@/components/providers/i18n-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { getLocale } from '@/services/i18n'

export default async ({ children }: React.PropsWithChildren) => {
  const [locale] = await getLocale()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <I18nProvider>
          <ThemeProvider>
            {children}
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  )
}

export * from './metadata'
