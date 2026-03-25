'use client'

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { type Locale, type Messages } from 'next-intl'

import { setLocaleCookie } from '@/actions/cookies'
import { type IntlRecord, type LocaleItem, i18n, localizeRecord } from '@/lib/i18n'

interface I18nContextValue {
  locale?: Locale
  messages?: Messages
  timeZone?: string
}

export const useI18nContext = (value: I18nContextValue) => {
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
        return { ...item, displayLabel, label }
      }),
    [locale, messageStore]
  )

  const setMessages = useCallback(async (locale: Locale) => {
    if (messageStoreRef.current[locale]) {
      return
    }
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

  useEffect(() => {
    void setMessages(locale)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { locale, localeItems, localize, messages, setLocale, timeZone }
}

export type I18nContextType = Omit<ReturnType<typeof useI18nContext>, 'messages' | 'timeZone'>

export const I18nContext = createContext<I18nContextType | null>(null)

export type { I18nContextValue }
