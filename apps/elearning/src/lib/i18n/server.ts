'use server'

import { createTranslator, type Locale, type Messages, type NamespaceKeys, type NestedKeyOf } from 'use-intl'

import { i18n } from '@/lib/i18n/config'
import { type Translator } from '@/lib/i18n/types'
import { getCookie, setCookie } from '@/lib/storage/server'

export const getLocale = async () => {
  const localeCookie = await getCookie('NEXT_LOCALE', { prefix: false })
  return localeCookie || i18n.defaultLocale
}

export const setLocale = async (locale: Locale) => {
  await setCookie('NEXT_LOCALE', locale)
}

export const getMessages = async (locale?: Locale) => {
  const currentLocale = locale ?? (await getLocale())
  const json = (await import(`config/translations/${currentLocale}.json`)) as { default: Messages }
  return json.default
}

/**
 * Extends the `use-intl` provider to allow dynamic translations.
 */
export const getTranslations = async <NestedKey extends NamespaceKeys<Messages, NestedKeyOf<Messages>> = never>(
  namespace?: NestedKey,
  options?: {
    locale?: Locale
    messages?: Messages
  },
) => {
  const { locale = await getLocale(), messages: userMessages } = options ?? {}
  const messages = userMessages ?? (await getMessages(locale))
  const translations = createTranslator<Messages, NestedKey>({ namespace, locale, messages })
  // @ts-expect-error - Allow adding dynamic function
  translations.dynamic = (key: string) => translations(key)
  return translations as Translator<NestedKey>
}
