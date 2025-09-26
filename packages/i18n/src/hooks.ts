'use client'

import { useCallback, useContext, useMemo } from 'react'
import { useFormatter, useTranslations as useIntlTranslations } from 'use-intl/react'

import { titleize } from '@repo/utils/string'

import { i18n } from './config'
import { I18nContext } from './provider'
import { type IntlRecord, type Locale, type LocaleItem, type Namespace, type Translator } from './types'
import { intlPlaceholder, localizeDate as localizeDateFn, localize as localizeFn } from './utils'

export { useFormatter }

/**
 * Extends the hook from `use-intl` to provide additional utilities.
 */
export const useLocale = () => {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useLocale must be used within a I18nProvider')

  const t = useTranslations('Languages')

  const localeItems = useMemo<LocaleItem[]>(
    () =>
      i18n.localeItems.map(item => {
        const label = t(item.value)
        const displayLabel = i18n.titleCaseLocales.includes(context.locale) ? label : label.toLowerCase()

        return {
          ...item,
          label,
          displayLabel,
        }
      }),
    [context.locale, t],
  )

  const localize = useCallback(
    (record?: IntlRecord, locale: Locale = context.locale) => {
      if (!record) return record
      return localizeFn(record, locale)
    },
    [context.locale],
  )

  const localizeDate = useCallback(
    (input?: Date | string | number, type: 'short' | 'long' = 'long', locale: Locale = context.locale) => {
      if (!input) return input
      return localizeDateFn(input, type, locale)
    },
    [context.locale],
  )

  const isTitleCase = useMemo(() => i18n.titleCaseLocales.includes(context.locale), [context.locale])

  const format = useCallback(
    (input: string, locale: Locale = context.locale) =>
      i18n.titleCaseLocales.includes(locale) ? titleize(input) : input.toLowerCase(),
    [context.locale],
  )

  return {
    /**
     * Current application locale.
     */
    locale: context.locale,
    /**
     * Available application locales.
     */
    locales: i18n.locales,
    /**
     * Locale items used across the application.
     */
    localeItems,
    /**
     * Sets the current application locale.
     */
    setLocale: context.setLocale,
    /**
     * Localizes a JSON object based on the provided locale, or the current one if not specified.
     */
    localize,
    /**
     * Formats a date according to the provided locale, or the current one if not specified.
     */
    localizeDate,
    /**
     * Whether the current locale should be displayed in title case.
     */
    isTitleCase,
    /**
     * Formats a string according to the format of the provided locale, or the current one if not specified.
     */
    format,
    /**
     * Record with locale keys and empty string values.
     */
    intlPlaceholder,
  }
}

/**
 * Extends the `use-intl` hook to allow dynamic translations.
 */
export const useTranslations = <NestedKey extends Namespace = never>(namespace?: NestedKey) => {
  const translations = useIntlTranslations(namespace)
  // @ts-expect-error - Allow adding keys
  translations.dynamic = (key: string) => translations(key)
  return translations as Translator<NestedKey>
}
