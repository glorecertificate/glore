'use client'

import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { IntlProvider } from 'next-intl'

import { type Locale, type Messages, i18nConfig } from '@glore/i18n'
import { defineCookies } from '@glore/utils/cookies'

import { type Cookie } from '@/lib/storage'

export interface I18nProviderProps
  extends React.PropsWithChildren<{
    /** @default "NEXT_LOCALE" */
    cookie?: Cookie
    locale?: Locale
    messages?: Messages
    timezone?: string
  }> {}

export interface I18nContext {
  locale: Locale
  setLocale: (locale: Locale) => Promise<void>
}

export const I18nContext = createContext<I18nContext | null>(null)

export const I18nProvider = ({ children, cookie = 'NEXT_LOCALE', timezone, ...props }: I18nProviderProps) => {
  const defaultLocale = props.locale ?? i18nConfig.defaultLocale
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const timeZone = useMemo(() => timezone ?? Intl.DateTimeFormat(locale).resolvedOptions().timeZone, [locale, timezone])

  const [messageStore, setMessagesStore] = useState<Partial<Record<Locale, Messages>>>(
    props.messages ? { [defaultLocale]: props.messages } : {}
  )

  const setMessages = useCallback(
    async (locale: Locale) => {
      if (messageStore[locale]) return
      const { default: messages } = (await import(`../../../../../config/translations/${locale}.json`)) as {
        default: Messages
      }
      setMessagesStore(prev => ({ ...prev, [locale]: messages }))
    },
    [messageStore]
  )

  const setLocale = useCallback(
    async (locale: Locale) => {
      await setMessages(locale)
      setLocaleState(locale)

      if (cookie) {
        const cookies = defineCookies<{ [cookie]: Locale }>()
        cookies.set(cookie, locale)
      }
    },
    [cookie, setMessages]
  )

  useEffect(() => {
    void setMessages(locale)
  }, [locale, setMessages])

  const messages = useMemo(() => messageStore[locale] ?? {}, [locale, messageStore])

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      <IntlProvider locale={locale} messages={messages} timeZone={timeZone}>
        {children}
      </IntlProvider>
    </I18nContext.Provider>
  )
}
