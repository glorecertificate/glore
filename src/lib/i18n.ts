import type messages from '@messages/en'
import { type createTranslator, type NamespaceKeys, type NestedKeyOf } from 'next-intl'

import config from '@config/i18n'

export const LOCALE_COOKIE = 'NEXT_LOCALE'
export const DEFAULT_LOCALE = config.defaultLocale as Locale
export const LOCALES = Object.keys(config.locales) as Locale[]

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale
    Messages: Messages
    Formats: Formats
  }
}

type Locale = keyof typeof config.locales
type Messages = typeof messages
interface Formats {
  dateTime: {
    short: {
      day: 'numeric'
      month: 'short'
      year: 'numeric'
    }
  }
  list: {
    enumeration: {
      style: 'long'
      type: 'conjunction'
    }
  }
  number: {
    precise: {
      maximumFractionDigits: 5
    }
  }
}

export type Translator<NestedKey extends Namespace = never> = ReturnType<typeof createTranslator<Messages, NestedKey>>
export type Namespace = NamespaceKeys<Messages, NestedKeyOf<Messages>>
export type MessageKey<T extends Namespace> = T extends Namespace
  ? Parameters<ReturnType<typeof createTranslator<Messages, T>>>[0]
  : Exclude<NestedKeyOf<Messages>, keyof Messages>
export type IntlRecord<T = string> = Record<Locale, T>

export const i18n = {
  cookie: 'NEXT_LOCALE',
  locales: Object.keys(config.locales) as Locale[],
  defaultLocale: config.defaultLocale as Locale,
  titleizedLocales: Object.freeze(config.titleizedLocales) as Locale[],
  localeItems: Object.entries(config.locales).map(([locale, { flag, name }]) => ({
    displayLabel: name,
    icon: flag,
    label: name,
    value: locale as Locale,
  })),
} as const

export const localize = (record: IntlRecord, locale: Locale, fallback?: Locale) => {
  if (typeof record !== 'object' || Array.isArray(record) || record === null) return ''
  if (Object.keys(record).includes(locale)) return record[locale] as string
  return fallback && Object.keys(record).includes(fallback) ? (record[fallback] as string) : ''
}

export const localizeDate = (input: Date | string | number, locale: Locale, format: 'short' | 'long' = 'long') =>
  format === 'short'
    ? new Intl.DateTimeFormat(locale).format(new Date(input))
    : new Date(input).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
