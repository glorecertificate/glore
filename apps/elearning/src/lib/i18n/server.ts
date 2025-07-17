'use server'

import { createTranslator, type Locale, type Messages, type NamespaceKeys, type NestedKeyOf } from 'use-intl'

import { getCookie, setCookie } from '@/lib/storage/server'
import config from 'config/app.json'

import { type MessageKey } from './types'

export const getLocale = async () => {
  const localeCookie = await getCookie('NEXT_LOCALE', { prefix: false })
  return localeCookie || (config.defaultLocale as Locale)
}

export const setLocale = async (locale: Locale) => {
  await setCookie('NEXT_LOCALE', locale)
}

export const getMessages = async (locale?: Locale) => {
  const currentLocale = locale ?? (await getLocale())
  const json = (await import(`config/translations/${currentLocale}.json`)) as { default: Messages }
  return json.default
}

export const getTranslations = async <
  NestedKey extends NamespaceKeys<Messages, NestedKeyOf<Messages>> = never,
>(options?: {
  namespace?: NestedKey
  locale?: Locale
  messages?: Messages
}) => {
  const { locale = await getLocale(), messages = await getMessages(options?.locale), namespace } = options || {}
  return createTranslator<Messages, NestedKey>({ locale, messages, namespace })
}

export const getFlatTranslations = async () => {
  const translations = await getTranslations()
  // @ts-expect-error - Allow getting translations without arguments
  return <Key extends MessageKey>(namespace: Key) => translations(namespace, {})
}
