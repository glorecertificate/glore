'use client'

import { type Locale } from 'use-intl'
import { IntlProvider } from 'use-intl/react'

import type translations from 'config/translations/en.json'

export const I18nProvider = ({
  children,
  ...props
}: React.PropsWithChildren<{
  locale: Locale
  messages: typeof translations
}>) => <IntlProvider {...props}>{children}</IntlProvider>
