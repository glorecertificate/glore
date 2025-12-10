import type { createTranslator, NamespaceKeys, NestedKeyOf } from 'next-intl'

import config from '@config/i18n'
import type messages from '@config/translations/en'

type Locale = keyof typeof config.locales
type Messages = typeof messages
type Formats = typeof config.formats

declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale
    Messages: Messages
    Formats: Formats
  }
}

export type Translator<NestedKey extends Namespace = never> = ReturnType<typeof createTranslator<Messages, NestedKey>>
export type Namespace = NamespaceKeys<Messages, NestedKeyOf<Messages>>
export type NamespaceKey<N extends Namespace> = Parameters<ReturnType<typeof createTranslator<Messages, N>>>[0]
export type MessageKey = Exclude<NestedKeyOf<Messages>, keyof Messages>
export type IntlRecord = Record<Locale, string>

export const i18n = {
  locales: Object.keys(config.locales) as Locale[],
  defaultLocale: config.defaultLocale as Locale,
  titleCaseLocales: Object.freeze(config.titleCaseLocales) as Locale[],
  localeItems: Object.entries(config.locales).map(([locale, { flag, name }]) => ({
    displayLabel: name,
    icon: flag,
    label: name,
    value: locale as Locale,
  })),
  placeholder: Object.keys(config.locales).reduce((record, locale) => ({ ...record, [locale]: '' }), {} as IntlRecord),
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
