'use client'

import { useTranslations } from 'next-intl'

import { INVITATION_ERROR_CODES, type InvitationErrorCode } from '@/db/queries/organization'

const isInvitationCode = (code: string | null | undefined): code is InvitationErrorCode =>
  (INVITATION_ERROR_CODES as readonly string[]).includes(code ?? '')

export const useInvitationError = () => {
  const t = useTranslations('Invitations')

  return (code?: string | null) => (isInvitationCode(code) ? t(`error_${code}`) : t('error_generic'))
}
