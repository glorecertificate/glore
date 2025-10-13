'use client'

import { useCallback, useContext, useMemo } from 'react'

import {
  type IntlRecord,
  type Locale,
  type LocaleItem,
  i18nConfig,
  localizeDate as localizeDateFn,
  localize as localizeFn,
} from '@glore/i18n'

import { I18nContext } from '@/components/providers/i18n-provider'
import { useTranslations } from '@/hooks/use-translations'

/**
 * Extends the hook from `next-intl` to provide additional utilities.
 */
export const useLocale = () => {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useLocale must be used within a I18nProvider')

  const t = useTranslations('Languages')

  const localeItems = useMemo<LocaleItem[]>(
    () =>
      i18nConfig.localeItems.map(item => {
        const label = t(item.value)
        const displayLabel = i18nConfig.titleCaseLocales.includes(context.locale) ? label : label.toLowerCase()

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

  const isTitleCase = useMemo(() => i18nConfig.titleCaseLocales.includes(context.locale), [context.locale])

  const format = useCallback(
    (input: string, locale: Locale = context.locale) =>
      i18nConfig.titleCaseLocales.includes(locale)
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
    locales: i18nConfig.locales,
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
