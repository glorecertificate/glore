import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

export const I18nProvider = async ({ children }: React.PropsWithChildren) => (
  <NextIntlClientProvider messages={await getMessages()}>{children}</NextIntlClientProvider>
)
