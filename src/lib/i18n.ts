import { type NamespaceKeys, type NestedKeyOf, type createTranslator } from 'next-intl'

import { defaultLocale, locales, titleizedLocales } from '~/config/i18n.json'
import type messages from '~/messages/en.json'

type Locale = keyof typeof locales

type Messages = typeof messages

interface Formats {
  dateTime: { short: { day: 'numeric'; month: 'short'; year: 'numeric' } }
  list: { enumeration: { style: 'long'; type: 'conjunction' } }
  number: { precise: { maximumFractionDigits: 5 } }
}

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale
    Messages: Messages
    Formats: Formats
  }
}

export type Namespace = NamespaceKeys<Messages, NestedKeyOf<Messages>>

type Translator<NestedKey extends NamespaceKeys<Messages, NestedKeyOf<Messages>> = never> = ReturnType<
  typeof createTranslator<Messages, NestedKey>
>

export type MessageKey<T extends Namespace> = T extends Namespace
  ? Parameters<Translator<T>>[0] extends infer K
    ? K extends string
      ? K
      : never
    : never
  : never

export type IntlRecord<T = string> = Record<Locale, T>

export const LOCALE_COOKIE = 'NEXT_LOCALE'
export const DEFAULT_LOCALE = defaultLocale as Locale
export const LOCALES = Object.keys(locales) as Locale[]
export const LOCALE_ITEMS = Object.entries(locales).map(([locale, item]) => ({ ...item, value: locale as Locale }))
export const TITLEIZED_LOCALES = titleizedLocales as Locale[]
export const INTL_PLACEHOLDER = LOCALES.reduce((record, locale) => ({ ...record, [locale]: '' }), {} as IntlRecord<''>)

export const localizeRecord = <T>(record: IntlRecord<T>, locale: Locale, fallback?: Locale) => {
  if (!record || typeof record !== 'object') return ''
  if (locale in record) return record[locale] as string
  if (fallback && fallback in record) return record[fallback] as string
  return ''
}
