'use client'

import { useCallback, useContext, useMemo } from 'react'

import { useTranslations } from 'next-intl'

import { I18nContext } from '@/components/providers/i18n-provider'
import { type IntlRecord, i18n, localize, localizeDate } from '@/lib/i18n'

/**
 * Hook to access internationalization (i18n) utilities.
 */
export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within a I18nProvider')

  const { locale, setLocale } = context
  const t = useTranslations('Locale.Languages')

  const localeItems = useMemo<typeof i18n.localeItems>(
    () =>
      i18n.localeItems.map(item => {
        const label = t(item.value)
        const displayLabel = i18n.titleCaseLocales.includes(locale) ? label : label.toLowerCase()
        return { ...item, label, displayLabel }
      }),
    [locale, t]
  )

  return {
    /**
     * Current application locale.
     */
    locale,
    /**
     * Locale items used across the application.
     */
    localeItems,
    /**
     * Sets the current application locale.
     */
    setLocale,
    /**
     * Localizes a JSON object based on the provided locale, or the current one if not specified.
     */
    localize: useCallback((record: IntlRecord) => localize(record, context.locale), [context.locale]),
    /**
     * Formats a date according to the provided locale, or the current one if not specified.
     */
    localizeDate: useCallback(
      (input: Date | string | number, format?: 'short' | 'long') =>
        input ? localizeDate(input, context.locale, format) : input,
      [context.locale]
    ),
  }
}
