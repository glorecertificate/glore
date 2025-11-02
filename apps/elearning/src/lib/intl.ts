import { type createTranslator, type NamespaceKeys, type NestedKeyOf } from 'next-intl'

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
export type NavigationKey = NestedKeyOf<Messages['Navigation']>
export type IntlRecord = Partial<Record<Locale, string>>

export interface LocaleItem {
  label: string
  displayLabel: string
  value: Locale
  icon: string
}

export const LOCALES = Object.keys(config.locales) as Locale[]
export const DEFAULT_LOCALE = config.defaultLocale as Locale
export const TITLE_CASE_LOCALES = Object.freeze(config.titleCaseLocales) as Locale[]

export const LOCALE_ITEMS: LocaleItem[] = Object.entries(config.locales).map(([value, { flag, name }]) => ({
  displayLabel: name,
  icon: flag,
  label: name,
  value: value as Locale,
}))

export const INTL_PLACEHOLDER = LOCALES.reduce((acc, locale) => ({ ...acc, [locale]: '' }), {} as IntlRecord)

export const localize = (record: IntlRecord, locale: Locale, fallback?: Locale) => {
  if (!record) return ''
  if (Object.keys(record).includes(locale)) return record[locale] as string
  return fallback && Object.keys(record).includes(fallback) ? (record[fallback] as string) : ''
}

export const localizeDate = (
  input: Date | string | number,
  type: 'short' | 'long' = 'long',
  locale: Locale
): string => {
  const date = typeof input === 'object' ? input : new Date(input)
  if (type === 'short') return new Intl.DateTimeFormat(locale).format(date)
  return new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}
