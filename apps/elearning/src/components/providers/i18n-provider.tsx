'use client'

import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { type Locale, type Messages } from 'use-intl'
import { IntlProvider } from 'use-intl/react'

import { timezone } from '@repo/utils/timezone'

import { cookies } from '@/lib/storage/cookies'
import app from 'config/app.json'

export interface I18nProviderProps
  extends React.PropsWithChildren<{
    locale: Locale
    messages: Messages
  }> {}

export interface I18nContext {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const I18nContext = createContext<I18nContext | null>(null)

export const I18nProvider = ({ children, ...props }: I18nProviderProps) => {
  const [locale, setLocaleState] = useState<Locale>(props.locale || cookies.get('NEXT_LOCALE') || app.defaultLocale)
  const [messages, setMessages] = useState<Messages>(props.messages || {})
  const timeZone = useMemo(() => timezone(), [])

  const setLocale = useCallback((locale: Locale) => {
    setLocaleState(locale)
    cookies.set('NEXT_LOCALE', locale, { prefix: false })
  }, [])

  const fetchMessages = useCallback(async () => {
    const json = (await import(`config/translations/${locale}.json`)) as { default: Messages }
    setMessages(json.default)
  }, [locale])

  useEffect(() => {
    void fetchMessages()
  }, [fetchMessages, locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      <IntlProvider locale={locale} messages={messages} timeZone={timeZone}>
        {children}
      </IntlProvider>
    </I18nContext.Provider>
  )
}
