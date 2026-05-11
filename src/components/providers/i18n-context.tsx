'use client'

import { createContext, useEffect, useRef, useState } from 'react'

import { type Locale, type Messages } from 'next-intl'
import { NextIntlClientProvider } from 'next-intl'

import { setLocaleCookie } from '@/actions/cookies'
import { type IntlRecord, i18n, localizeRecord } from '@/lib/i18n'

interface I18nContextValue {
  locale?: Locale
  messages?: Messages
  timeZone?: string
}

const useI18nContext = (value: I18nContextValue) => {
  const [localeState, setLocaleState] = useState<Locale>(value.locale ?? i18n.defaultLocale)
  const [messageStore, setMessageStore] = useState<Partial<Record<Locale, Messages>>>(
    value.messages ? { [localeState]: value.messages } : {}
  )
  const messageStoreRef = useRef(messageStore)
  messageStoreRef.current = messageStore
  const messages = messageStore[localeState]
  const timeZone = value.timeZone ?? Intl.DateTimeFormat(localeState).resolvedOptions().timeZone

  const localeItems = i18n.localeItems.map(item => {
    const label = messageStore[localeState]?.Intl.Languages?.[item.value] ?? item.label
    const displayLabel = i18n.titleCaseLocales.includes(localeState) ? label : label.toLowerCase()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { locale: localeState, localeItems, localize, messages, setLocale, timeZone }
}

export const I18nContext = createContext<Omit<ReturnType<typeof useI18nContext>, 'messages' | 'timeZone'> | null>(null)

export const I18nProvider = ({ children, value, ...props }: React.ProviderProps<I18nContextValue>) => {
  const { locale, messages, timeZone, ...providerValue } = useI18nContext(value)
  const contextValue = { ...providerValue, locale }

  return (
    <I18nContext.Provider value={contextValue} {...props}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  )
}
