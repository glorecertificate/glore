import { type Locale } from 'use-intl'

import { type Json } from '@repo/utils'

import { type LocaleItem } from '@/lib/i18n/types'
import config from 'config/app.json'

/**
 * List of supported locales in the application, derived from the app configuration.
 */
export const LOCALES = Object.keys(config.locales) as Locale[]

/**
 * Items used to display the available locales across the application.
 */
export const LOCALE_ITEMS = Object.entries(config.locales).map(
  ([value, { flag, name }]) =>
    ({
      label: name,
      value,
      icon: flag,
    }) as LocaleItem,
)

/**
 * Localizes a JSON object based on the provided locale.
 */
export const localizeJson = <T extends Json>(data: T, locale?: Locale, fallback?: Locale): string | undefined => {
  if (typeof data !== 'object' || data === null) return String(data)
  if (Array.isArray(data))
    return data
      .map(item => localizeJson(item, locale, fallback))
      .filter(Boolean)
      .join(', ')
  const locales = Object.keys(data)
  if (!locale || !locales.length) return data[locales[0]] as string | undefined
  if (locales.includes(locale)) return data[locale] as string | undefined
  const fallbackLocale = fallback || locales[0] || config.defaultLocale
  return data[fallbackLocale] as string
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
  return new Date(date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * Localizes an array of items based on the provided locale.
 */
export const localizeItems = (locale: Locale, items = LOCALE_ITEMS) =>
  items.map(item => ({
    ...item,
    label: localizeJson(item.label, locale),
  }))
