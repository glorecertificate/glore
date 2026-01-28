'use client'

import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { IntlProvider, type Locale, type Messages } from 'next-intl'

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

  const messages = messageStore[locale]

  const localeItems = useMemo<LocaleItem[]>(
    () =>
      i18n.localeItems.map(item => {
        const label = messageStore[locale]?.Locale.Languages?.[item.value] ?? item.label
        const displayLabel = i18n.titleCaseLocales.includes(item.value) ? label : label.toLowerCase()
        return { ...item, label, displayLabel }
      }),
    [locale, messageStore[locale]]
  )

  const setMessages = useCallback(
    async (locale: Locale) => {
      if (messageStore[locale]) return
      const { default: messages } = (await import(`~/messages/${locale}`)) as { default: Messages }
      setMessagesStore(prev => ({ ...prev, [locale]: messages }))
    },
    [messageStore]
  )

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
      <IntlProvider locale={locale} messages={messages} timeZone={timeZone}>
        {children}
      </IntlProvider>
    </I18nContext.Provider>
  )
}
