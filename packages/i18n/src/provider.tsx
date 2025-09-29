'use client'

import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { IntlProvider } from 'use-intl/react'

import { defineCookies } from '@repo/utils/cookies'

import { i18n } from './config'
import { type Locale, type Messages } from './types'

export interface I18nProviderProps
  extends React.PropsWithChildren<{
    cookie?: string
    locale?: Locale
    messages?: Messages
    timezone?: string
  }> {}

export interface I18nContext {
  locale: Locale
  setLocale: (locale: Locale) => Promise<void>
}

export const I18nContext = createContext<I18nContext | null>(null)

export const I18nProvider = ({ children, cookie, timezone, ...props }: I18nProviderProps) => {
  const defaultLocale = props.locale ?? i18n.defaultLocale
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const timeZone = useMemo(() => timezone ?? Intl.DateTimeFormat(locale).resolvedOptions().timeZone, [locale])

  const [messageStore, setMessagesStore] = useState<Partial<Record<Locale, Messages>>>(
    props.messages ? { [defaultLocale]: props.messages } : {},
  )

  const cookies = useMemo(() => (cookie ? defineCookies<{ [cookie]: Locale }>() : defineCookies()), [cookie])

  const setMessages = useCallback(
    async (locale: Locale) => {
      if (messageStore[locale]) return
      const { default: messages } = (await import(`../../../config/translations/${locale}.json`)) as {
        default: Messages
      }
      setMessagesStore(prev => ({ ...prev, [locale]: messages }))
    },
    [locale],
  )

  const setLocale = useCallback(async (locale: Locale) => {
    await setMessages(locale)
    setLocaleState(locale)
    if (cookie) cookies.set(cookie, locale)
  }, [])

  useEffect(() => {
    void setMessages(locale)
  }, [locale])

  const messages = useMemo(() => messageStore[locale] ?? {}, [locale, messageStore])

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      <IntlProvider locale={locale} messages={messages} timeZone={timeZone}>
        {children}
      </IntlProvider>
    </I18nContext.Provider>
  )
}
