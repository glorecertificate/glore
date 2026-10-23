'use client'

import { useTranslations } from 'next-intl'

import { useActionError } from '@/hooks/use-action-error'

const KNOWN_CODES = [
  'AI_EMPTY',
  'AI_INCOMPATIBLE',
  'AI_INVALID',
  'AI_NOT_CONFIGURED',
  'AI_ORPHANED',
  'AI_UNAVAILABLE',
  'CONFLICT',
  'FORBIDDEN',
  'INCOMPATIBLE',
  'INVALID',
  'INVALID_INPUT',
  'NOT_FOUND',
  'NO_DRAFT',
  'ORPHANED',
  'RATE_LIMITED',
] as const

type KnownCode = (typeof KNOWN_CODES)[number]

const isKnownCode = (code: string | null | undefined): code is KnownCode => KNOWN_CODES.includes(code as KnownCode)

export const errorCodeOf = (result: object) => {
  if (!('error' in result) || typeof result.error !== 'object' || result.error === null) return null
  return 'code' in result.error && typeof result.error.code === 'string' ? result.error.code : 'UNKNOWN'
}

export const useTranslationError = () => {
  const t = useTranslations('Translations.errors')
  const actionError = useActionError()

  return (code: string) => actionError({ code }, isKnownCode(code) ? t(code) : t('UNKNOWN'))
}
