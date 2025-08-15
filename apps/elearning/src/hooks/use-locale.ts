'use client'

import { useCallback, useContext } from 'react'

import { I18nContext } from '@/components/providers/i18n-provider'
import { LOCALE_ITEMS, LOCALES, TITLE_CASE_LOCALES } from '@/lib/i18n/config'
import { type IntlRecord, type Locale } from '@/lib/i18n/types'
import * as utils from '@/lib/i18n/utils'

/**
 * Extends the hook from `use-intl` to support localization of JSON values.
 */
export const useLocale = () => {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useLocale must be used within a I18nProvider')

  const localize = useCallback(
    (record?: IntlRecord, locale?: Locale) => {
      if (!record) return record
      return utils.localize(record, locale ?? context.locale)
    },
    [context.locale],
  )

  const localizeDate = useCallback(
    (input?: Date | string | number, type: 'short' | 'long' = 'long', locale?: Locale) => {
      if (!input) return input
      return utils.localizeDate(input, type, locale ?? context.locale)
    },
    [context.locale],
  )

  return {
    ...context,
    /**
     * Application locales.
     */
    locales: LOCALES,
    /**
     * Locale items used across the application.
     */
    localeItems: LOCALE_ITEMS,
    /**
     * Locales that should be displayed in title case.
     */
    titleCaseLocales: TITLE_CASE_LOCALES,
    /**
     * Localizes a JSON object based on the provided locale.
     */
    localize,
    /**
     * Formats a date according to the provided locale.
     */
    localizeDate,
    /**
     * Checks if the provided locale should be displayed in title case.
     */
    isTitleCase: (locale: Locale) => TITLE_CASE_LOCALES.includes(locale),
  }
}
