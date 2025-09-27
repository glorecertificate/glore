import { i18n, type Locale, type Messages, type Namespace } from '@repo/i18n'
import { getMessages as getMessagesBase, getTranslations as getTranslationsBase } from '@repo/i18n/ssr'

import { getCookie, setCookie } from '@/lib/storage/ssr'

export const getLocale = async () => (await getCookie('NEXT_LOCALE', { prefix: false })) ?? i18n.defaultLocale

export const setLocale = async (locale: Locale) => await setCookie('NEXT_LOCALE', locale)

export const getMessages = async (locale?: Locale) => getMessagesBase(locale ?? (await getLocale()))

export const getTranslations = async <NestedKey extends Namespace = never>(
  namespace?: NestedKey,
  options: {
    locale?: Locale
    messages?: Messages
  } = {},
) => {
  const { locale = await getLocale(), messages = await getMessages() } = options
  return getTranslationsBase(namespace, { locale, messages })
}
