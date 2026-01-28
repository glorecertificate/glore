'use client'

import { useContext } from 'react'

import { I18nContext } from '@/components/providers/i18n-provider'

/**
 * Accesses i18n context for localization and locale management.
 */
export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) throw Error('useI18n must be used within a I18nProvider')
  return context
}
