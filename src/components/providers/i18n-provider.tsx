'use client'

import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { IntlProvider, type Locale, type Messages } from 'next-intl'

import i18nConfig from '@config/i18n'
import { setLocaleCookie } from '@/actions/cookies'
import { i18n } from '@/lib/i18n'

export const I18nContext = createContext<{
  locale: Locale
  localeItems: Array<{
    displayLabel: string
    icon: string
    label: string
    value: Locale
  }>
  setLocale: (locale: Locale) => Promise<void>
} | null>(null)

export const I18nProvider = ({
  children,
  value,
  ...props
}: React.ProviderProps<{
  locale?: Locale
  messages?: Messages
  timeZone?: string
}>) => {
  const [locale, setLocaleState] = useState<Locale>(value.locale ?? i18n.defaultLocale)
  const timeZone = value.timeZone ?? Intl.DateTimeFormat(locale).resolvedOptions().timeZone

  const [messageStore, setMessagesStore] = useState<Partial<Record<Locale, Messages>>>(
    value.messages ? { [locale]: value.messages } : {}
  )

  const localeItems = useMemo(
    () =>
      Object.entries(i18nConfig.locales).map(([item, { flag: icon, name }]) => {
        const value = item as Locale
        const label = messageStore[locale]?.Locale.Languages?.[value] ?? name
        const displayLabel = i18nConfig.titleizedLocales.includes(value) ? label : label.toLowerCase()
        return { displayLabel, icon, label, value }
      }),
    [locale, messageStore[locale]]
  )

  const setMessages = useCallback(
    async (locale: Locale) => {
      if (messageStore[locale]) return
      const { default: messages } = (await import(`@messages/${locale}`)) as { default: Messages }
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

  // biome-ignore lint/correctness: Run on mount
  useEffect(() => {
    void setMessages(locale)
  }, [])

  return (
    <I18nContext.Provider value={{ locale, localeItems, setLocale }} {...props}>
      <IntlProvider locale={locale} messages={messageStore[locale]} timeZone={timeZone}>
        {children}
      </IntlProvider>
    </I18nContext.Provider>
  )
}
