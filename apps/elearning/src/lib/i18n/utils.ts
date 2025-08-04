import { type Locale } from 'use-intl'

import { isPlainObject, type AnyRecord } from '@repo/utils'

import { LOCALES } from '@/lib/i18n/config'
import { type IntlRecord, type Localized } from '@/lib/i18n/types'

/**
 * Localizes a record based on the provided locale.
 */
export const localizeRecord = <T extends AnyRecord>(record: T, locale: Locale, fallback?: Locale): Localized<T> =>
  Object.entries(record).reduce((acc, [key, value]) => {
    const next = { ...acc, [key as keyof Localized<T>]: value as Localized<T>[keyof Localized<T>] }
    if (!isPlainObject(value)) return next
    const keys = Object.keys(value as object)
    if (keys.length === 0 || !keys.every(key => LOCALES.includes(key as Locale))) return next
    return { ...acc, [key]: localize(value as IntlRecord, locale, fallback) }
  }, {} as Localized<T>)

/**
 * Localizes a JSON object based on the provided locale.
 */
export const localize = (record: IntlRecord, locale: Locale, fallback?: Locale) => {
  const keys = Object.keys(record)
  if (keys.includes(locale)) return record[locale]
  return fallback ? record[fallback] : undefined
}

/**
 * Formats a date according to the provided locale.
 */
export const localizeDate = (
  input: Date | string | number,
  type: 'short' | 'long' = 'long',
  locale: Locale,
): string => {
  const date = typeof input === 'object' ? input : new Date(input)
  if (type === 'short') return new Intl.DateTimeFormat(locale).format(date)
  return new Date(date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
}
