import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { ThemeProvider } from 'next-themes'

import { Theme } from '@/lib/theme'

export const AppProvider = async ({ children }: React.PropsWithChildren) => (
  <NextIntlClientProvider messages={await getMessages()}>
    <ThemeProvider attribute="class" enableSystem themes={Object.values(Theme)}>
      {children}
    </ThemeProvider>
  </NextIntlClientProvider>
)
