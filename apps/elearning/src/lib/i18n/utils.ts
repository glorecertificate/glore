import { type Json } from '@repo/utils'

import config from 'config/app.json'

import { type Locale } from './types'

export const LOCALES = Object.keys(config.locales) as Locale[]

/**
 * Localizes a JSON object based on the provided locale.
 */
export const localizeJson = <T extends Json>(data: T, locale: Locale): string => {
  if (typeof data !== 'object' || data === null) return String(data)
  if (Array.isArray(data)) return data.map(item => localizeJson(item, locale)).join(', ')
  return data[locale] as string
}

/**
 * Formats a date according to the provided locale.
 */
export const localizeDate = (
  input: Date | string | number,
  locale: Locale,
  type: 'short' | 'long' = 'long',
): string => {
  const date = typeof input === 'object' ? input : new Date(input)

  if (type === 'short') return new Intl.DateTimeFormat(locale).format(date)

  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
