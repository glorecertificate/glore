import { i18nConfig } from './config'
import { type IntlRecord, type Locale, type Messages } from './types'

/**
 * A placeholder object for internationalized fields.
 */
export const intlPlaceholder = i18nConfig.locales.reduce((acc, locale) => ({ ...acc, [locale]: '' }), {} as IntlRecord)

/**
 * Retrieves messages for the specified locale.
 */
export const getMessages = async (locale: Locale) =>
  (await import(`../../../config/translations/${locale}`)).default as Messages

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
  locale: Locale
): string => {
  const date = typeof input === 'object' ? input : new Date(input)
  if (type === 'short') return new Intl.DateTimeFormat(locale).format(date)
  return new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}
