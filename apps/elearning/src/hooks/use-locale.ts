'use client'

import { useCallback, useMemo } from 'react'

import { useLocale as useIntl, type Locale } from 'use-intl'

import { type Json } from '@repo/utils'

import { useTranslations } from '@/hooks/use-translations'
import { setLocale } from '@/lib/i18n/server'
import { localeItems as items, localizeJson } from '@/lib/i18n/utils'

/**
 * Extends the hook from `use-intl` to support localization of JSON values.
 * It provides a `localize` function that takes a JSON value and an optional locale,
 * returning a localized string representation of the value.
 */
export const useLocale = () => {
  const nextLocale = useIntl()
  const t = useTranslations('Languages')

  const localize = useCallback(
    (value: Json, locale?: Locale): string => localizeJson(value, locale ?? nextLocale),
    [nextLocale],
  )

  const localeItems = useMemo(
    () =>
      items.map(item => ({
        ...item,
        label: t(item.value),
      })),
    [t],
  )

  return { locale: nextLocale, setLocale, localize, localeItems } as {
    locale: Locale
    setLocale: (locale: Locale) => Promise<void>
    localize: (value: Json) => string
    localeItems: typeof localeItems
  }
}
