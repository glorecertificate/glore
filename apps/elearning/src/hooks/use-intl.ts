'use client'

import { useCallback, useContext, useMemo } from 'react'

import { type Locale, useTranslations } from 'next-intl'

import { IntlContext } from '@/components/providers/intl-provider'
import {
  type IntlRecord,
  LOCALE_ITEMS,
  LOCALES,
  type LocaleItem,
  localizeDate as localizeDateFn,
  localize as localizeFn,
  TITLE_CASE_LOCALES,
} from '@/lib/intl'

/**
 * Hook to access internationalization (i18n) utilities.
 */
export const useIntl = () => {
  const context = useContext(IntlContext)
  if (!context) throw new Error('useIntl must be used within a IntlProvider')

  const t = useTranslations('Languages')

  const localeItems = useMemo<LocaleItem[]>(
    () =>
      LOCALE_ITEMS.map(item => {
        const label = t(item.value)
        const displayLabel = TITLE_CASE_LOCALES.includes(context.locale) ? label : label.toLowerCase()

        return {
          ...item,
          label,
          displayLabel,
        }
      }),
    [context.locale, t]
  )

  const localize = useCallback(
    (record?: IntlRecord, locale: Locale = context.locale) => {
      if (!record) return record
      return localizeFn(record, locale)
    },
    [context.locale]
  )

  const localizeDate = useCallback(
    (input?: Date | string | number, type: 'short' | 'long' = 'long', locale: Locale = context.locale) => {
      if (!input) return input
      return localizeDateFn(input, type, locale)
    },
    [context.locale]
  )

  const isTitleCase = useMemo(() => TITLE_CASE_LOCALES.includes(context.locale), [context.locale])

  const format = useCallback(
    (input: string, locale: Locale = context.locale) =>
      TITLE_CASE_LOCALES.includes(locale)
        ? input
            .split(' ')
            .map(word => (word.length > 3 ? word.charAt(0).toUpperCase() + word.slice(1) : word.toLowerCase()))
            .join(' ')
        : input.toLowerCase(),
    [context.locale]
  )

  return {
    /**
     * Current application locale.
     */
    locale: context.locale,
    /**
     * Available application locales.
     */
    locales: LOCALES,
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
  }
}
