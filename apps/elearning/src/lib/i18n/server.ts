'use server'

import { cookies } from 'next/headers'

import { getMessages, getRequestConfig, getTranslations } from 'next-intl/server'

import { Cookie } from '@/lib/storage'
import config from 'static/config.json'

import type { Locale, MessageKey } from './types'

export const getLocale = async () => {
  const store = await cookies()
  return (store.get(Cookie.Locale)?.value || config.defaultLocale) as Locale
}

export const setLocale = async (locale: Locale) => {
  const cookieStore = await cookies()
  cookieStore.set(Cookie.Locale, locale)
}

export const getFlatTranslations = async () => {
  const translations = await getTranslations()
  // @ts-expect-error - Allow getting translations without arguments
  return <Key extends MessageKey>(namespace: Key) => translations(namespace, {})
}

export { getMessages, getRequestConfig, getTranslations }
