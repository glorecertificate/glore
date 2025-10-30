'use client'

import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { type Locale, type Messages, IntlProvider as NextIntlProvider } from 'next-intl'

import { defineCookies } from '@glore/utils/cookies'

import { DEFAULT_LOCALE } from '@/lib/intl'
import { type Cookie } from '@/lib/storage'

export interface IntlProviderProps
  extends React.PropsWithChildren<{
    /** @default "NEXT_LOCALE" */
    cookie?: Cookie
    locale?: Locale
    messages?: Messages
    timezone?: string
  }> {}

export interface IntlContext {
  locale: Locale
  setLocale: (locale: Locale) => Promise<void>
}

export const IntlContext = createContext<IntlContext | null>(null)

export const IntlProvider = ({ children, cookie = 'NEXT_LOCALE', timezone, ...props }: IntlProviderProps) => {
  const defaultLocale = props.locale ?? DEFAULT_LOCALE
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const timeZone = useMemo(() => timezone ?? Intl.DateTimeFormat(locale).resolvedOptions().timeZone, [locale, timezone])

  const [messageStore, setMessagesStore] = useState<Partial<Record<Locale, Messages>>>(
    props.messages ? { [defaultLocale]: props.messages } : {}
  )

  const setMessages = useCallback(
    async (locale: Locale) => {
      if (messageStore[locale]) return
      const { default: messages } = (await import(`../../../config/translations/${locale}.json`)) as {
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
    <IntlContext.Provider value={{ locale, setLocale }}>
      <NextIntlProvider locale={locale} messages={messages} timeZone={timeZone}>
        {children}
      </NextIntlProvider>
    </IntlContext.Provider>
  )
}
