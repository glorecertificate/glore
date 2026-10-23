import 'server-only'

import { and, eq, sql } from 'drizzle-orm'

import { type Transaction } from '@/db/client'
import { recordEvent } from '@/db/mutations/activity-event'
import { type MessageTarget } from '@/db/queries/message-override'
import {
  type MESSAGE_REVISION_ACTIONS,
  messageOverrideRevisions,
  messageOverrides,
} from '@/db/schema/message-overrides'
import { namespaceOf } from '@/lib/message-validation'

const ERROR_CODES = ['CONFLICT', 'NO_DRAFT', 'NOT_FOUND'] as const

type MessageErrorCode = (typeof ERROR_CODES)[number]

export const messageError = (code: MessageErrorCode) => Object.assign(new Error(code), { code })

export const isMessageError = (error: unknown): error is Error & { code: MessageErrorCode } =>
  error instanceof Error && 'code' in error && ERROR_CODES.includes(error.code as MessageErrorCode)

interface Hashes {
  baseHash: string | null
  sourceHash: string
}

interface Actor {
  actorId: string
}

const findForUpdate = async (tx: Transaction, { key, locale }: MessageTarget) => {
  const [row] = await tx
    .select()
    .from(messageOverrides)
    .where(and(eq(messageOverrides.locale, locale), eq(messageOverrides.key, key)))
    .for('update')
  return row ?? null
}

const recordRevision = async (
  tx: Transaction,
  { actorId, key, locale }: Actor & MessageTarget,
  action: (typeof MESSAGE_REVISION_ACTIONS)[number],
  value: string | null
) => {
  await tx.insert(messageOverrideRevisions).values({ action, actorId, key, locale, value })
}

export const saveMessageDraft = async (
  tx: Transaction,
  {
    actorId,
    baseHash,
    key,
    locale,
    origin = 'human',
    sourceHash,
    value,
  }: Actor & Hashes & MessageTarget & { origin?: 'human' | 'machine'; value: string }
) => {
  const [row] = await tx
    .insert(messageOverrides)
    .values({
      baseHash,
      draftValue: value,
      key,
      locale,
      namespace: namespaceOf(key),
      origin,
      sourceHash,
      updatedById: actorId,
    })
    .onConflictDoUpdate({
      target: [messageOverrides.locale, messageOverrides.key],
      set: {
        origin,
        baseHash: sql`case when ${messageOverrides.value} is null then ${baseHash}::text else ${messageOverrides.baseHash} end`,
        draftValue: value,
        sourceHash: sql`case when ${messageOverrides.value} is null then ${sourceHash}::text else ${messageOverrides.sourceHash} end`,
        updatedById: actorId,
      },
    })
    .returning()
  if (!row) throw messageError('NOT_FOUND')
  await recordRevision(tx, { actorId, key, locale }, 'draft', value)
  return row
}

export const publishMessageDraft = async (
  tx: Transaction,
  { actorId, baseHash, expected, key, locale, sourceHash }: Actor & Hashes & MessageTarget & { expected: string }
) => {
  const current = await findForUpdate(tx, { key, locale })
  if (!current) throw messageError('NOT_FOUND')
  if (current.draftValue === null) throw messageError('NO_DRAFT')
  if (current.draftValue !== expected) throw messageError('CONFLICT')

  const [row] = await tx
    .update(messageOverrides)
    .set({
      baseHash,
      draftValue: null,
      publishedAt: new Date().toISOString(),
      publishedById: actorId,
      sourceHash,
      updatedById: actorId,
      value: current.draftValue,
    })
    .where(eq(messageOverrides.id, current.id))
    .returning()
  if (!row) throw messageError('NOT_FOUND')

  await recordRevision(tx, { actorId, key, locale }, 'publish', current.draftValue)
  const event = await recordEvent(tx, {
    actorId,
    data: { key, locale, namespace: row.namespace },
    organizationId: null,
    type: 'messages.published',
  })
  return { event, row }
}

export const resetMessageOverride = async (tx: Transaction, { actorId, key, locale }: Actor & MessageTarget) => {
  const current = await findForUpdate(tx, { key, locale })
  if (!current) throw messageError('NOT_FOUND')

  await tx.delete(messageOverrides).where(eq(messageOverrides.id, current.id))
  await recordRevision(tx, { actorId, key, locale }, 'reset', null)
  const event = await recordEvent(tx, {
    actorId,
    data: { key, locale, namespace: current.namespace },
    organizationId: null,
    type: 'messages.reset',
  })
  return { event, wasPublished: current.value !== null }
}

export const discardMessageDraft = async (tx: Transaction, { actorId, key, locale }: Actor & MessageTarget) => {
  const current = await findForUpdate(tx, { key, locale })
  if (!current) throw messageError('NOT_FOUND')
  if (current.draftValue === null) throw messageError('NO_DRAFT')

  await recordRevision(tx, { actorId, key, locale }, 'discard', null)
  if (current.value === null) {
    await tx.delete(messageOverrides).where(eq(messageOverrides.id, current.id))
    return { remaining: false }
  }
  await tx
    .update(messageOverrides)
    .set({ draftValue: null, updatedById: actorId })
    .where(eq(messageOverrides.id, current.id))
  return { remaining: true }
}
