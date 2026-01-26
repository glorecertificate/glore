'use client'

import { useCallback, useContext } from 'react'

import { I18nContext } from '@/components/providers/i18n-provider'
import { type IntlRecord, localize, localizeDate } from '@/lib/i18n'

// localeItems: Object.entries(config.locales).map(([locale, { flag, name }]) => ({
//     displayLabel: name,
//     icon: flag,
//     label: name,
//     value: locale as Locale,
//   })),

/**
 * Hook to access internationalization utilities.
 */
export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within a I18nProvider')

  return {
    ...context,
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
