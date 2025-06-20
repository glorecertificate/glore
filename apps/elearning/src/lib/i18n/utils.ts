import { type AnyRecord, type Json, type Primitive } from '@repo/utils'

import config from 'static/config.json'

import { type IntlJson, type Locale, type Localized } from './types'

export const LOCALES = Object.keys(config.locales) as Locale[]

export const localizeJson = <T extends Json>(data: T, locale: Locale): string => {
  if (typeof data !== 'object' || data === null) return String(data)
  if (Array.isArray(data)) return data.map(item => localizeJson(item, locale)).join(', ')
  return data[locale] as string
}

/**
 * Localizes a given record according to the provided locale.
 */
export const localize = <T extends AnyRecord>(data: T, locale: Locale): Localized<T> =>
  Array.isArray(data)
    ? (data.map(item => localize(item, locale)) as Localized<T>)
    : LOCALES.some(locale => !!data[locale])
      ? (data[locale] as Localized<T>)
      : Object.entries(data).reduce((obj, [key, value]) => {
          if (typeof value !== 'object' || value === null) return { ...obj, [key]: value as Primitive }
          if (Array.isArray(value)) return { ...obj, [key]: value.map(item => localize(item, locale)) }
          if (LOCALES.some(locale => !!(value as IntlJson)[locale]))
            return { ...obj, [key]: (value as IntlJson)?.[locale] }
          return { ...obj, [key]: localize(value, locale) }
        }, {} as Localized<T>)

/**
 * Formats a date according to the provided locale.
 */
export const localDate = (date: Date | string | number, locale: Locale): string =>
  new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

/**
 * Formats a date to a short date string according to the provided locale.
 */
export const localShortDate = (date: Date | number, locale: Locale): string =>
  new Intl.DateTimeFormat(locale).format(date)
