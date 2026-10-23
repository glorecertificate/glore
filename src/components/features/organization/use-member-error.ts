'use client'

import { useTranslations } from 'next-intl'

import { MEMBER_ERROR_CODES, type MemberErrorCode } from '@/db/queries/organization'
import { useActionError } from '@/hooks/use-action-error'

const isMemberCode = (code: string | null | undefined): code is MemberErrorCode =>
  (MEMBER_ERROR_CODES as readonly string[]).includes(code ?? '')

export const useMemberError = () => {
  const t = useTranslations('Organization')
  const actionError = useActionError()

  return (code?: string | null) =>
    actionError({ code }, isMemberCode(code) ? t(`memberError_${code}`) : t('memberError_generic'))
}
