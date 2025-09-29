import { createTranslator } from 'use-intl/core'

import { i18n } from './config'
import { type IntlRecord, type Locale, type Messages, type Namespace, type Translator } from './types'

/**
 * Retrieves messages for the specified locale.
 */
export const getMessages = async (locale: Locale) => {
  const messages = (await import(`../../../config/translations/${locale}.json`)) as { default: Messages }
  return messages.default
}

/**
 * Retrieves a translator function for the specified namespace and options.
 */
export const getTranslations = async <NestedKey extends Namespace = never>(
  namespace?: NestedKey,
  options?: {
    locale?: Locale
    messages?: Messages
  },
) => {
  const { locale = i18n.defaultLocale, messages = await getMessages(locale) } = options ?? {}
  const translations = createTranslator<Messages, NestedKey>({ locale, messages, namespace })
  // @ts-expect-error - Allow dynamic translations
  translations.dynamic = (key: string) => translations(key)
  return translations as Translator<NestedKey>
}

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
  return new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Record with locale keys and empty string values.
 */
export const intlPlaceholder = i18n.locales.reduce((acc, locale) => {
  acc[locale] = ''
  return acc
}, {} as IntlRecord)
