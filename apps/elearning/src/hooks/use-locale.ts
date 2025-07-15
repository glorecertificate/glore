'use client'

import { useCallback, useMemo } from 'react'

import { useLocale as useNextIntlLocale, type Locale } from 'next-intl'

import { type Json } from '@repo/utils'

import { useTranslations } from '@/hooks/use-translations'
import { setLocale } from '@/lib/i18n/server'
import { localeItems, localizeJson } from '@/lib/i18n/utils'

/**
 * Extends the hook from `next-intl` to support localization of JSON values.
 * It provides a `localize` function that takes a JSON value and an optional locale,
 * returning a localized string representation of the value.
 */
export const useLocale = () => {
  const nextLocale = useNextIntlLocale()
  const t = useTranslations('Languages')

  const localize = useCallback(
    (value: Json, locale?: Locale): string => localizeJson(value, locale ?? nextLocale),
    [nextLocale],
  )

  const items = useMemo(
    () =>
      localeItems.map(item => ({
        ...item,
        label: t.flat(item.value),
      })),
    [t],
  )

  return { items, locale: nextLocale, localize, setLocale } as {
    items: typeof items
    locale: Locale
    localize: (value: Json) => string
    setLocale: (locale: Locale) => Promise<void>
  }
}
