import {
  getTranslations as createTranslations,
  getMessages,
  i18n,
  type Locale,
  type Messages,
  type Namespace,
} from '@repo/i18n'

import { getCookie, setCookie } from '@/lib/storage/ssr'

export const getLocale = async () => (await getCookie('NEXT_LOCALE', { prefix: false })) ?? i18n.defaultLocale

export const setLocale = async (locale: Locale) => await setCookie('NEXT_LOCALE', locale)

export const getTranslations = async <NestedKey extends Namespace = never>(
  namespace?: NestedKey,
  options: {
    locale?: Locale
    messages?: Messages
  } = {},
) => {
  const { locale = await getLocale(), messages = await getMessages(locale) } = options
  return createTranslations(namespace, { locale, messages })
}
