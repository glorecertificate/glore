'use client'

import { createContext, use, useEffect, useRef, useState } from 'react'

import { type Locale, type Messages, NextIntlClientProvider } from 'next-intl'

import { setLocaleCookie } from '@/actions/cookies'
import { DEFAULT_LOCALE, type IntlRecord, LOCALE_ITEMS, TITLEIZED_LOCALES, localizeRecord } from '@/lib/i18n'

interface I18nContextValue {
  locale?: Locale
  messages?: Messages
  timeZone?: string
}

const useI18nContext = (value: I18nContextValue) => {
  const [localeState, setLocaleState] = useState<Locale>(value.locale ?? DEFAULT_LOCALE)
  const [messageStore, setMessageStore] = useState<Partial<Record<Locale, Messages>>>(
    value.messages ? { [localeState]: value.messages } : {}
  )
  const messageStoreRef = useRef(messageStore)
  messageStoreRef.current = messageStore
  const messages = messageStore[localeState]
  // eslint-disable-next-line react-compiler/capitalized-calls
  const timeZone = value.timeZone ?? Intl.DateTimeFormat(localeState).resolvedOptions().timeZone

  const localeItems = LOCALE_ITEMS.map(item => {
    const label = messageStore[localeState]?.Intl.Languages?.[item.value] ?? item.label
    const displayLabel = TITLEIZED_LOCALES.includes(localeState) ? label : label.toLowerCase()
    return { ...item, displayLabel, label }
  })

  const setMessages = async (locale: Locale) => {
    if (messageStoreRef.current[locale]) return
    const messagesModule = await import(`~/messages/${locale}`)
    setMessageStore(prev => ({ ...prev, [locale]: messagesModule.default }))
  }

  const setLocale = async (locale: Locale) => {
    await setMessages(locale)
    setLocaleState(locale)
    setLocaleCookie(locale)
  }

  const localize = <T,>(record: IntlRecord<T>, fallback?: Locale) => localizeRecord(record, localeState, fallback)

  useEffect(() => {
    void setMessages(localeState)
  }, [localeState])

  return { locale: localeState, localeItems, localize, messages, setLocale, timeZone }
}

const I18nContext = createContext<Omit<ReturnType<typeof useI18nContext>, 'messages' | 'timeZone'> | null>(null)

export const I18nProvider = ({ children, ...props }: React.PropsWithChildren<I18nContextValue>) => {
  const { locale, messages, timeZone, ...context } = useI18nContext(props)
  const value = { ...context, locale }

  return (
    <I18nContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  )
}

export const useI18n = () => {
  const context = use(I18nContext)
  if (!context) throw new Error('useI18n must be used within an I18nProvider')
  return context
}
