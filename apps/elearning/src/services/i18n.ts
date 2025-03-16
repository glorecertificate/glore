'use server'

import { cookies } from 'next/headers'

import { type Locale } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'

import { Cookie } from '@/lib/storage'
import app from 'config/app.json'
import type i18n from 'config/i18n.json'
import type messages from 'config/translations/en.json'

declare module 'next-intl' {
  interface AppConfig {
    Locale: keyof typeof i18n.locales
    Messages: typeof messages
  }
}

export type { Locale }

export const getLocale = async () => {
  const store = await cookies()
  return (store.get(Cookie.Locale)?.value || app.locale) as Locale
}

export const setLocale = async (locale: Locale) => {
  const cookieStore = await cookies()
  cookieStore.set(Cookie.Locale, locale)
}

export { getMessages, getTranslations }
