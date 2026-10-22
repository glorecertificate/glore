'use client'

import { useTranslations } from 'next-intl'

import { isKnownAdminErrorCode } from '@/db/queries/admin-user'

export const useAdminError = () => {
  const t = useTranslations('Admin.errors')

  return (code?: string | null) => (isKnownAdminErrorCode(code) ? t(code) : t('UNKNOWN'))
}
