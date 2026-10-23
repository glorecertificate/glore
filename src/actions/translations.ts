'use server'

import 'server-only'

import { unstable_rethrow } from 'next/navigation'

import { and, desc, eq } from 'drizzle-orm'

import { authorizeEditor, authorizeMessage, inspectMessage } from '@/actions/message-helpers'
import { db, transaction } from '@/db/client'
import { isMessageError, saveMessageDraft as saveDraft } from '@/db/mutations/message-override'
import { messageTargetSchema } from '@/db/queries/message-override'
import { messageOverrideRevisions, messageOverrides, users } from '@/db/schema'
import { resolveAiModels } from '@/lib/ai'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import { loadCatalogs, loadOverrideEntries } from '@/lib/message-entries'
import { suggestMessageText } from '@/lib/message-suggestion'
import { loadRawMessages, usesPrecompiledMessages } from '@/lib/messages'
import { isRateLimited } from '@/lib/rate-limit'
import { fullName } from '@/lib/utils'

const HOUR = 60 * 60 * 1000

const SUGGESTIONS_PER_HOUR = 40

const HISTORY_LIMIT = 30

const failure = (code: string) => ({ error: { code, message: code } })

export const loadTranslations = async () => {
  if (!(await authorizeEditor())) return failure('FORBIDDEN')
  const catalogs = await loadCatalogs()
  return { data: { catalogs, overrides: await loadOverrideEntries(catalogs) } }
}

export const listMessageOverrides = async () => {
  if (!(await authorizeEditor())) return failure('FORBIDDEN')
  return { data: await loadOverrideEntries(await loadCatalogs()) }
}

export const listMessageHistory = async (input: { key: string; locale: string }) => {
  const parsed = messageTargetSchema.safeParse(input)
  if (!parsed.success) return failure('INVALID_INPUT')
  if (!(await authorizeEditor())) return failure('FORBIDDEN')
  const { key, locale } = parsed.data

  const rows = await db
    .select({
      action: messageOverrideRevisions.action,
      createdAt: messageOverrideRevisions.createdAt,
      firstName: users.firstName,
      id: messageOverrideRevisions.id,
      lastName: users.lastName,
      value: messageOverrideRevisions.value,
    })
    .from(messageOverrideRevisions)
    .leftJoin(users, eq(users.id, messageOverrideRevisions.actorId))
    .where(and(eq(messageOverrideRevisions.locale, locale), eq(messageOverrideRevisions.key, key)))
    .orderBy(desc(messageOverrideRevisions.id))
    .limit(HISTORY_LIMIT)

  return {
    data: rows.map(({ action, createdAt, firstName, id, lastName, value }) => ({
      action,
      actor: fullName({ firstName, lastName }) || null,
      createdAt,
      id,
      value,
    })),
  }
}

export const suggestMessage = async (input: { key: string; locale: string }) => {
  const parsed = messageTargetSchema.safeParse(input)
  if (!parsed.success || parsed.data.locale === DEFAULT_LOCALE) return failure('INVALID_INPUT')
  const { key, locale } = parsed.data

  const actor = await authorizeMessage(key)
  if (!actor) return failure('FORBIDDEN')
  if (await isRateLimited(`message-suggest:${actor.id}`, SUGGESTIONS_PER_HOUR, HOUR)) return failure('RATE_LIMITED')

  const models = resolveAiModels()
  if (!models) return failure('AI_NOT_CONFIGURED')

  const [en, own, precompiled, [existing]] = await Promise.all([
    loadRawMessages(DEFAULT_LOCALE),
    loadRawMessages(locale),
    usesPrecompiledMessages(),
    db
      .select({ draftValue: messageOverrides.draftValue, value: messageOverrides.value })
      .from(messageOverrides)
      .where(and(eq(messageOverrides.locale, locale), eq(messageOverrides.key, key))),
  ])
  const suggestion = await suggestMessageText({
    current: existing?.draftValue ?? existing?.value ?? own[key] ?? null,
    en,
    key,
    locale,
    models,
    precompiled,
  })
  if (!suggestion.ok) {
    return failure(suggestion.reason === 'UNAVAILABLE' ? 'AI_UNAVAILABLE' : `AI_${suggestion.reason}`)
  }

  const { baseHash, result, sourceHash } = await inspectMessage(locale, key, suggestion.value)
  if (!result.ok) return failure('AI_INVALID')

  try {
    await transaction(tx =>
      saveDraft(tx, {
        actorId: actor.id,
        baseHash,
        key,
        locale,
        origin: 'machine',
        sourceHash,
        value: suggestion.value,
      })
    )
    return { data: { key, locale, value: suggestion.value } }
  } catch (error) {
    unstable_rethrow(error)
    if (isMessageError(error)) return failure(error.code)
    throw error
  }
}
