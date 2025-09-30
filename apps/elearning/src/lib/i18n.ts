'use server'

import { createTranslator } from 'use-intl'

import { getMessages, i18n, type Locale, type Messages, type Namespace, type Translator } from '@glore/i18n'

import { createCookieClient } from '@/lib/storage'

/**
 * Retrieves the current locale from cookies or returns the default locale.
 */
export const getLocale = async () => {
  const { get } = await createCookieClient()
  return get('NEXT_LOCALE', { prefix: false }) ?? i18n.defaultLocale
}

/**
 * Sets the current locale in cookies.
 */
export const setLocale = async (locale: Locale) => {
  const { set } = await createCookieClient()
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
