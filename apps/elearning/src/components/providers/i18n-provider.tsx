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
}>) => {
  const defaultTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return (
    <IntlProvider timeZone={defaultTimeZone} {...props}>
      {children}
    </IntlProvider>
  )
}
