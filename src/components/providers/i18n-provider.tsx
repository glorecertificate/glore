'use client'

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { type Locale, type Messages, NextIntlClientProvider } from 'next-intl'

import { setLocaleCookie } from '@/actions/cookies'
import { type IntlRecord, i18n, type LocaleItem, localizeRecord } from '@/lib/i18n'

interface I18nContextValue {
  locale?: Locale
  messages?: Messages
  timeZone?: string
}

const useI18nContext = (value: I18nContextValue) => {
  const [locale, setLocaleState] = useState<Locale>(value.locale ?? i18n.defaultLocale)
  const timeZone = value.timeZone ?? Intl.DateTimeFormat(locale).resolvedOptions().timeZone

  const [messageStore, setMessagesStore] = useState<Partial<Record<Locale, Messages>>>(
    value.messages ? { [locale]: value.messages } : {}
  )
  const messageStoreRef = useRef(messageStore)
  messageStoreRef.current = messageStore

  const messages = useMemo(() => messageStore[locale], [locale, messageStore])

  const localeItems = useMemo<LocaleItem[]>(
    () =>
      i18n.localeItems.map(item => {
        const label = messageStore[locale]?.Intl.Languages?.[item.value] ?? item.label
        const displayLabel = i18n.titleCaseLocales.includes(locale) ? label : label.toLowerCase()
        return { ...item, label, displayLabel }
      }),
    [locale, messageStore]
  )

  const setMessages = useCallback(async (locale: Locale) => {
    if (messageStoreRef.current[locale]) return
    const { default: messages } = (await import(`~/messages/${locale}`)) as { default: Messages }
    setMessagesStore(prev => ({ ...prev, [locale]: messages }))
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
    <T,>(record: IntlRecord<T>, fallback?: Locale) => localizeRecord(record, locale, fallback),
    [locale]
  )

  // biome-ignore lint/correctness: Run on mount only
  useEffect(() => {
    void setMessages(locale)
  }, [])

  return { locale, localeItems, messages, timeZone, setLocale, localize }
}

export const I18nContext = createContext<Omit<ReturnType<typeof useI18nContext>, 'messages' | 'timeZone'> | null>(null)

export const I18nProvider = ({ children, value, ...props }: React.ProviderProps<I18nContextValue>) => {
  const { locale, messages, timeZone, ...providerValue } = useI18nContext(value)

  return (
    <I18nContext.Provider value={{ ...providerValue, locale }} {...props}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  )
}
