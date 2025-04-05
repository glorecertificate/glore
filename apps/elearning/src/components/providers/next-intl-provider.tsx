import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

export const NextIntlProvider = async ({ children }: React.PropsWithChildren) => (
  <NextIntlClientProvider messages={await getMessages()}>{children}</NextIntlClientProvider>
)
