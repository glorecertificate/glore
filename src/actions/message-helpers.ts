import 'server-only'

import { requireAdmin } from '@/actions/admin/helpers'
import { requireEditor } from '@/actions/guards'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import { hashMessage } from '@/lib/message-overrides'
import { isProtectedKey, validateOverride } from '@/lib/message-validation'
import { loadRawMessages, usesPrecompiledMessages } from '@/lib/messages'

export const authorizeMessage = async (key: string) => {
  try {
    return isProtectedKey(key) ? await requireAdmin() : await requireEditor()
  } catch {
    return null
  }
}

export const authorizeAdmin = async () => {
  try {
    return await requireAdmin()
  } catch {
    return null
  }
}

export const authorizeEditor = async () => {
  try {
    return await requireEditor()
  } catch {
    return null
  }
}

export const inspectMessage = async (locale: string, key: string, value: string) => {
  const [en, own, precompiled] = await Promise.all([
    loadRawMessages(DEFAULT_LOCALE),
    loadRawMessages(locale),
    usesPrecompiledMessages(),
  ])
  const result = validateOverride({ en, key, precompiled, value })
  const source = en[key]
  const base = own[key]
  return {
    baseHash: base === undefined ? null : hashMessage(base),
    result,
    sourceHash: source === undefined ? '' : hashMessage(source),
  }
}
