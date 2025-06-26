'use client'

import { useCallback } from 'react'

import { useLocale as useNextIntlLocale } from 'next-intl'

import { type Json } from '@repo/utils'

import { setLocale } from '@/lib/i18n/server'
import { type Locale } from '@/lib/i18n/types'
import { localizeJson } from '@/lib/utils'

export const useLocale = () => {
  const nextLocale = useNextIntlLocale()
  const localize = useCallback(
    (value: Json, locale?: Locale): string => localizeJson(value, locale ?? nextLocale),
    [nextLocale],
  )

  return { locale: nextLocale, localize, setLocale } as {
    locale: Locale
    localize: (value: Json) => string
    setLocale: (locale: Locale) => Promise<void>
  }
}
