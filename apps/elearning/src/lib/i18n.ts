import { createTranslator } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { type Locale, type Messages, type Namespace, type Translator, getMessages, i18nConfig } from '@glore/i18n'

import { createCookieStore } from '@/lib/server'

export default getRequestConfig(async () => {
  const locale = await getLocale()
  const messages = await getMessages(locale)
  return { locale, messages }
})

/**
 * Retrieves the current locale from cookies or returns the default locale.
 */
export const getLocale = async () => {
  const { get } = await createCookieStore()
  return get('NEXT_LOCALE', { prefix: false }) ?? i18nConfig.defaultLocale
}

/**
 * Sets the current locale in cookies.
 */
export const setLocale = async (locale: Locale) => {
  const { set } = await createCookieStore()
  await set('NEXT_LOCALE', locale, { prefix: false })
}

/**
 * Retrieves a translator function for the specified namespace and options.
 */
export const getTranslations = async <NestedKey extends Namespace = never>(
  namespace?: NestedKey,
  options: {
    locale?: Locale
    messages?: Messages
  } = {}
) => {
  const { locale = await getLocale(), messages = await getMessages(locale) } = options
  const translations = createTranslator<Messages, NestedKey>({ locale, messages, namespace })
  // @ts-expect-error - Allow dynamic translations
  translations.dynamic = (key: string) => translations(key)
  return translations as Translator<NestedKey>
}
