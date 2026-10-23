'use client'

import { useTranslations } from 'next-intl'

import { IMPERSONATION_LOCKED } from '@/lib/constants'

export const useActionError = () => {
  const t = useTranslations('Common')

  return (error: { code?: string | null } | null | undefined, fallback: string) =>
    error?.code === IMPERSONATION_LOCKED ? t('impersonationLocked') : fallback
}
