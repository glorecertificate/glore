'use client'

import { useMemo } from 'react'

import { NextIntlClientProvider } from 'next-intl'

import { I18nContext, type I18nContextValue, useI18nContext } from '@/components/providers/i18n-context'

export const I18nProvider = ({ children, value, ...props }: React.ProviderProps<I18nContextValue>) => {
  const { locale, messages, timeZone, ...providerValue } = useI18nContext(value)
  const contextValue = useMemo(() => ({ ...providerValue, locale }), [providerValue, locale])

  return (
    <I18nContext.Provider value={contextValue} {...props}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  )
}
