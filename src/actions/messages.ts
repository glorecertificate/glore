'use server'

import 'server-only'

import { updateTag } from 'next/cache'
import { unstable_rethrow } from 'next/navigation'

import { and, eq } from 'drizzle-orm'

import { requireAdmin } from '@/actions/admin/helpers'
import { requireEditor } from '@/actions/guards'
import { db, transaction } from '@/db/client'
import {
  discardMessageDraft as discardDraft,
  isMessageError,
  publishMessageDraft as publishDraft,
  resetMessageOverride as resetOverride,
  saveMessageDraft as saveDraft,
} from '@/db/mutations/message-override'
import { messageDraftSchema, messageTargetSchema, parseMessageOverride } from '@/db/queries/message-override'
import { messageOverrides } from '@/db/schema/message-overrides'
import { messagesTag } from '@/lib/cache'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n'
import { hashMessage, isProtectedKey, validateOverride } from '@/lib/message-overrides'
import { loadRawMessages, usesPrecompiledMessages } from '@/lib/messages'

const failure = (code: string) => ({ error: { code, message: code } })

const authorize = async (key: string) => {
  try {
    return isProtectedKey(key) ? await requireAdmin() : await requireEditor()
  } catch {
    return null
  }
}

const expire = (locale: string) => {
  for (const target of locale === DEFAULT_LOCALE ? LOCALES : [locale]) updateTag(messagesTag(target))
}

const inspect = async (locale: string, key: string, value: string) => {
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

const rejection = (reason: 'incompatible' | 'invalid' | 'orphaned') => failure(reason.toUpperCase())

const findOverride = async (locale: string, key: string) => {
  const [row] = await db
    .select()
    .from(messageOverrides)
    .where(and(eq(messageOverrides.locale, locale), eq(messageOverrides.key, key)))
  return row ?? null
}

const handle = (error: unknown) => {
  unstable_rethrow(error)
  if (isMessageError(error)) return failure(error.code)
  throw error
}

export const saveMessageDraft = async (input: { key: string; locale: string; value: string }) => {
  const parsed = messageDraftSchema.safeParse(input)
  if (!parsed.success) return failure('INVALID_INPUT')
  const { key, locale, value } = parsed.data

  const actor = await authorize(key)
  if (!actor) return failure('FORBIDDEN')

  const { baseHash, result, sourceHash } = await inspect(locale, key, value)
  if (!result.ok) return rejection(result.reason)

  try {
    const row = await transaction(tx => saveDraft(tx, { actorId: actor.id, baseHash, key, locale, sourceHash, value }))
    return { data: parseMessageOverride(row) }
  } catch (error) {
    return handle(error)
  }
}

export const publishMessage = async (input: { key: string; locale: string }) => {
  const parsed = messageTargetSchema.safeParse(input)
  if (!parsed.success) return failure('INVALID_INPUT')
  const { key, locale } = parsed.data

  const actor = await authorize(key)
  if (!actor) return failure('FORBIDDEN')

  const current = await findOverride(locale, key)
  if (!current) return failure('NOT_FOUND')
  if (current.draftValue === null) return failure('NO_DRAFT')

  const { baseHash, result, sourceHash } = await inspect(locale, key, current.draftValue)
  if (!result.ok) return rejection(result.reason)

  try {
    const { row } = await transaction(tx =>
      publishDraft(tx, {
        actorId: actor.id,
        baseHash,
        expected: current.draftValue as string,
        key,
        locale,
        sourceHash,
      })
    )
    expire(locale)
    return { data: parseMessageOverride(row) }
  } catch (error) {
    return handle(error)
  }
}

export const resetMessage = async (input: { key: string; locale: string }) => {
  const parsed = messageTargetSchema.safeParse(input)
  if (!parsed.success) return failure('INVALID_INPUT')
  const { key, locale } = parsed.data

  const actor = await authorize(key)
  if (!actor) return failure('FORBIDDEN')

  try {
    const { wasPublished } = await transaction(tx => resetOverride(tx, { actorId: actor.id, key, locale }))
    if (wasPublished) expire(locale)
    return { data: { key, locale } }
  } catch (error) {
    return handle(error)
  }
}

export const discardMessageDraft = async (input: { key: string; locale: string }) => {
  const parsed = messageTargetSchema.safeParse(input)
  if (!parsed.success) return failure('INVALID_INPUT')
  const { key, locale } = parsed.data

  const actor = await authorize(key)
  if (!actor) return failure('FORBIDDEN')

  try {
    const { remaining } = await transaction(tx => discardDraft(tx, { actorId: actor.id, key, locale }))
    return { data: { key, locale, remaining } }
  } catch (error) {
    return handle(error)
  }
}
