'use client'

import { createContext, use, useState } from 'react'

import { type Locale, type Messages, NextIntlClientProvider } from 'next-intl'

import { setLocaleCookie } from '@/actions/cookies'
import {
  DEFAULT_LOCALE,
  type IntlRecord,
  LOCALE_ITEMS,
  TIME_ZONE,
  TITLEIZED_LOCALES,
  clientMessages,
  localizeRecord,
} from '@/lib/i18n'

interface I18nContextValue {
  locale?: Locale
  messages?: Messages
  timeZone?: string
}

interface LocaleOverride {
  base: Locale
  locale: Locale
}

const useI18nContext = (value: I18nContextValue) => {
  const serverLocale = value.locale ?? DEFAULT_LOCALE
  const [override, setOverride] = useState<LocaleOverride | null>(null)
  const [messageStore, setMessageStore] = useState<Partial<Record<Locale, Messages>>>({})
  const localeState = override?.base === serverLocale ? override.locale : serverLocale
  const messages = (localeState === serverLocale ? value.messages : undefined) ?? messageStore[localeState]
  const timeZone = value.timeZone ?? TIME_ZONE

  const localeItems = LOCALE_ITEMS.map(item => {
    const label = messages?.Intl.Languages?.[item.value] ?? item.label
    const displayLabel = TITLEIZED_LOCALES.includes(localeState) ? label : label.toLowerCase()
    return { ...item, displayLabel, label }
  })

  const setLocale = async (locale: Locale) => {
    if (locale !== serverLocale && !messageStore[locale]) {
      const messagesModule = await import(`~/messages/${locale}`)
      setMessageStore(prev => ({ ...prev, [locale]: clientMessages(messagesModule.default) }))
    }
    setOverride({ base: serverLocale, locale })
    await setLocaleCookie(locale)
  }

  const localize = <T,>(record: IntlRecord<T>, fallback?: Locale) => localizeRecord(record, localeState, fallback)

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
