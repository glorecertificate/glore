import { type NamespaceKeys, type NestedKeyOf, type createTranslator } from 'next-intl'

import config from '~/config/i18n.json'
import type messages from '~/messages/en.json'

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

export interface LocaleItem {
  value: Locale
  label: string
  displayLabel: string
  icon: string
}

const locales = Object.keys(config.locales) as Locale[]
const defaultLocale = config.defaultLocale as Locale
const titleCaseLocales = config.titleCaseLocales as Locale[]
const localeItems = Object.entries(config.locales).map(([locale, item]) => ({ ...item, value: locale as Locale }))

export const i18n = {
  cookie: 'NEXT_LOCALE',
  defaultLocale,
  localeItems,
  locales,
  titleCaseLocales,
} as const

export const intlPlaceholder = locales.reduce((acc, locale) => ({ ...acc, [locale]: '' }), {} as Record<Locale, string>)

export const localizeRecord = <T>(record: IntlRecord<T>, locale: Locale, fallback?: Locale) => {
  if (!record || typeof record !== 'object') {
    return ''
  }
  if (locale in record) {
    return record[locale] as string
  }
  if (fallback && fallback in record) {
    return record[fallback] as string
  }
  return ''
}
