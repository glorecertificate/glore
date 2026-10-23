import compile from 'icu-minify/compile'

import { messageSignature } from './icu.ts'

const PROTECTED_NAMESPACES = ['CertificatePdf', 'CertificatePublic', 'Legal', 'Metadata'] as const

export type StaleState = 'incompatible' | 'orphaned' | 'outdated' | 'redundant'

export type RawCatalog = Record<string, string>

const KEY_SEPARATOR = '.'

const EMAIL_SUBJECT_REGEX = /^subject/u

export const namespaceOf = (key: string) => key.split(KEY_SEPARATOR)[0] ?? ''

export const isProtectedKey = (key: string) => {
  const namespace = namespaceOf(key)
  if ((PROTECTED_NAMESPACES as readonly string[]).includes(namespace)) return true
  if (namespace !== 'Email') return false
  return EMAIL_SUBJECT_REGEX.test(key.split(KEY_SEPARATOR).at(-1) ?? '')
}

export const sameTokens = (left: string[], right: string[]) =>
  left.length === right.length && left.every((token, index) => token === right[index])

const compileMessage = (value: string) => {
  try {
    return { compiled: compile(value) }
  } catch {
    return null
  }
}

interface ValidateOptions {
  en: RawCatalog
  key: string
  precompiled: boolean
  value: string
}

export const validateOverride = ({ en, key, precompiled, value }: ValidateOptions) => {
  const source = en[key]
  if (source === undefined) return { ok: false, reason: 'orphaned' } as const
  const signature = messageSignature(value)
  if (signature.errors.length > 0) return { ok: false, reason: 'invalid' } as const
  if (!sameTokens(signature.tokens, messageSignature(source).tokens)) {
    return { ok: false, reason: 'incompatible' } as const
  }
  if (!precompiled) return { ok: true, value } as const
  const result = compileMessage(value)
  if (!result) return { ok: false, reason: 'invalid' } as const
  return { ok: true, value: result.compiled } as const
}
