import 'server-only'

import { type Locale, type Messages } from 'next-intl'

import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n'

export const resolveLocale = (value: string | null | undefined) =>
  LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE

export const loadMessages = async (locale: string | null | undefined) => {
  const { default: messages } = await import(`~/messages/${resolveLocale(locale)}.json`)
  return messages as Messages
}
