'use client'

import { useTranslations } from 'next-intl'

import { IMPERSONATION_LOCKED } from '@/lib/constants'

export const useActionError = () => {
  const t = useTranslations('Common')
  const messages: Record<string, string> = {
    [IMPERSONATION_LOCKED]: t('impersonationLocked'),
    RATE_LIMITED: t('rateLimited'),
  }

  return (error: { code?: string | null } | null | undefined, fallback: string) =>
    messages[error?.code ?? ''] ?? fallback
}
