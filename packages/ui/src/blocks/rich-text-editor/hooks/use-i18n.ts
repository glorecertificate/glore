'use client'

import { useContext } from 'react'

import { I18nContext } from '../components/i18n-provider'
import type messages from '../i18n/en.json'

export const useI18n = <T extends keyof typeof messages | undefined = undefined>(namespace?: T) => {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within a I18nProvider')

  return {
    locale: context.locale,
    t: (namespace ? context.t[namespace] : context.t) as T extends keyof typeof messages
      ? (typeof messages)[T]
      : typeof messages,
  }
}
