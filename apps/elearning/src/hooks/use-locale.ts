'use client'

import { useCallback, useContext } from 'react'

import { type AnyRecord } from '@repo/utils/types'

import { I18nContext } from '@/components/providers/i18n-provider'
import { LOCALES } from '@/lib/i18n/config'
import { type IntlRecord, type Locale } from '@/lib/i18n/types'
import { localize, localizeDate, localizeRecord } from '@/lib/i18n/utils'

/**
 * Extends the hook from `use-intl` to support localization of JSON values.
 */
export const useLocale = () => {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useLocale must be used within a I18nProvider')

  return {
    LOCALES,
    ...context,
    localize: useCallback(
      (record?: IntlRecord, locale?: Locale) => {
        if (!record) return record
        return localize(record, locale ?? context.locale)
      },
      [context.locale],
    ),
    localizeDate: useCallback(
      (date: Date | string | number, type: 'short' | 'long' = 'long', locale?: Locale) =>
        localizeDate(date, type, locale ?? context.locale),
      [context.locale],
    ),
    localizeRecord: useCallback(
      <T extends AnyRecord>(record: T, locale?: Locale) => localizeRecord(record, locale ?? context.locale),
      [context.locale],
    ),
  }
}
