'use client'

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { type Locale, type Messages } from 'next-intl'
import { NextIntlClientProvider } from 'next-intl'

import { setLocaleCookie } from '@/actions/cookies'
import { type IntlRecord, type LocaleItem, i18n, localizeRecord } from '@/lib/i18n'

export interface I18nContextValue {
  locale?: Locale
  messages?: Messages
  timeZone?: string
}

const useI18nContext = (value: I18nContextValue) => {
  const [localeState, setLocaleState] = useState<Locale>(value.locale ?? i18n.defaultLocale)
  const [messageStore, setMessagesStore] = useState<Partial<Record<Locale, Messages>>>(
    value.messages ? { [localeState]: value.messages } : {}
  )
  const messageStoreRef = useRef(messageStore)
  messageStoreRef.current = messageStore
  const messages = useMemo(() => messageStore[localeState], [localeState, messageStore])
  const timeZone = value.timeZone ?? Intl.DateTimeFormat(localeState).resolvedOptions().timeZone

  const localeItems = useMemo<LocaleItem[]>(
    () =>
      i18n.localeItems.map(item => {
        const label = messageStore[localeState]?.Intl.Languages?.[item.value] ?? item.label
        const displayLabel = i18n.titleCaseLocales.includes(localeState) ? label : label.toLowerCase()
        return { ...item, displayLabel, label }
      }),
    [localeState, messageStore]
  )

  const setMessages = useCallback(async (locale: Locale) => {
    if (messageStoreRef.current[locale]) return
    const messagesModule = await import(`~/messages/${locale}`)
    setMessagesStore(prev => ({ ...prev, [locale]: messagesModule.default }))
  }, [])

  const setLocale = useCallback(
    async (locale: Locale) => {
      await setMessages(locale)
      setLocaleState(locale)
      setLocaleCookie(locale)
    },
    [setMessages]
  )

  const localize = useCallback(
    <T,>(record: IntlRecord<T>, fallback?: Locale) => localizeRecord(record, localeState, fallback),
    [localeState]
  )

  useEffect(() => {
    void setMessages(localeState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { locale: localeState, localeItems, localize, messages, setLocale, timeZone }
}

export const I18nContext = createContext<Omit<ReturnType<typeof useI18nContext>, 'messages' | 'timeZone'> | null>(null)

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
