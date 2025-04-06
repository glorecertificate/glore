'use server'

import { cookies } from 'next/headers'

import { type Locale, type Messages, type NestedKeyOf } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'

import { Cookie } from '@/lib/storage'
import i18n from 'config/i18n.json'
import type messages from 'config/translations/en.json'

declare module 'next-intl' {
  interface AppConfig {
    Locale: keyof typeof i18n.locales
    Messages: typeof messages
  }
}

type MessageKey = Exclude<NestedKeyOf<Messages>, keyof Messages>

type MessageKeyOf<T extends keyof Messages> = keyof Messages[T]

const getLocale = async () => {
  const store = await cookies()
  return (store.get(Cookie.Locale)?.value || i18n.defaultLocale) as Locale
}

const setLocale = async (locale: Locale) => {
  const cookieStore = await cookies()
  cookieStore.set(Cookie.Locale, locale)
}

export { getLocale, getMessages, getTranslations, setLocale, type Locale, type MessageKey, type MessageKeyOf, type Messages }
