'use client'

import { useTranslations } from 'next-intl'

import { isKnownLegalErrorCode } from '@/db/queries/legal'
import { useActionError } from '@/hooks/use-action-error'

export const useLegalError = () => {
  const t = useTranslations('LegalAdmin.errors')
  const actionError = useActionError()

  return (error: { code?: string | null; locales?: string[] } | null | undefined) => {
    const fallback = isKnownLegalErrorCode(error?.code)
      ? t(error.code, { locales: (error.locales ?? []).map(locale => locale.toUpperCase()).join(', ') })
      : t('UNKNOWN')
    return actionError(error, fallback)
  }
}
