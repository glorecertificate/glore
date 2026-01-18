'use client'

import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { IntlProvider, type Locale, type Messages } from 'next-intl'

import { setLocaleCookie } from '@/actions/cookies'
import { i18n } from '@/lib/i18n'

export const I18nContext = createContext<{
  locale: Locale
  setLocale: (locale: Locale) => Promise<void>
} | null>(null)

export interface I18nProviderProps
  extends React.PropsWithChildren<{
    locale?: Locale
    messages?: Messages
    timezone?: string
  }> {}

export const I18nProvider = ({ children, messages, timezone, ...props }: I18nProviderProps) => {
  const [locale, setLocaleState] = useState<Locale>(props.locale ?? i18n.defaultLocale)
  const timeZone = useMemo(() => timezone ?? Intl.DateTimeFormat(locale).resolvedOptions().timeZone, [locale, timezone])

  const [messageStore, setMessagesStore] = useState<Partial<Record<Locale, Messages>>>(
    messages ? { [locale]: messages } : {}
  )

  const setMessages = useCallback(
    async (locale: Locale) => {
      if (messageStore[locale]) return
      const { default: messages } = (await import(`@config/translations/${locale}`)) as {
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
      await setLocaleCookie(locale)
    },
    [setMessages]
  )

  // biome-ignore lint: correctness/useExhaustiveDependencies
  useEffect(() => {
    void setMessages(locale)
  }, [])

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      <IntlProvider locale={locale} messages={messageStore[locale]} timeZone={timeZone}>
        {children}
      </IntlProvider>
    </I18nContext.Provider>
  )
}
