'use server'

import { cookies } from 'next/headers'

import { createTranslator, type Locale, type Messages, type NamespaceKeys, type NestedKeyOf } from 'use-intl'

import { Cookie } from '@/lib/storage'
import config from 'config/app.json'

import { type MessageKey } from './types'

export const getLocale = async () => {
  const store = await cookies()
  return (store.get(Cookie.Locale)?.value || config.defaultLocale) as Locale
}

export const setLocale = async (locale: Locale) => {
  const cookieStore = await cookies()
  cookieStore.set(Cookie.Locale, locale)
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
