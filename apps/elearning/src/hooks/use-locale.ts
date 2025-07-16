'use client'

import { useContext } from 'react'

import { I18nContext } from '@/components/providers/i18n-provider'

/**
 * Extends the hook from `use-intl` to support localization of JSON values.
 * It provides a `localize` function that takes a JSON value and an optional locale,
 * returning a localized string representation of the value.
 */
export const useLocale = () => {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useLocale must be used within a I18nProvider')
  return context
}
