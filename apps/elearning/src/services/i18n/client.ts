'use server'

import { cookies } from 'next/headers'

import { type Locale } from 'next-intl'
import { getMessages, getRequestConfig, getTranslations } from 'next-intl/server'

import { Cookie } from '@/lib/storage'
import i18n from 'config/i18n.json'

export const getLocale = async () => {
  const store = await cookies()
  return (store.get(Cookie.Locale)?.value || i18n.defaultLocale) as Locale
}

export const setLocale = async (locale: Locale) => {
  const cookieStore = await cookies()
  cookieStore.set(Cookie.Locale, locale)
}

export { getMessages, getRequestConfig, getTranslations }
