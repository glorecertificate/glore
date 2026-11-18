'use server'

import 'server-only'

import {
  expireLegal,
  expireLegalOverview,
  legalAction,
  requireLegalAdmin,
  requireLegalEditor,
} from '@/actions/legal/helpers'
import { transaction } from '@/db/client'
import {
  createLegalDraft,
  discardLegalDraft,
  legalError,
  publishLegalVersion,
  saveLegalTranslation,
} from '@/db/mutations/legal'
import {
  type LegalPublishInput,
  type LegalTranslationInput,
  legalDraftInputSchema,
  legalPublishInputSchema,
  legalTranslationInputSchema,
  legalVersionInputSchema,
} from '@/db/queries/legal'

const LEGAL_WRITES_PER_HOUR = 200
const LEGAL_PUBLISHES_PER_HOUR = 20

export const createDraft = async (input: { slug: string }) =>
  await legalAction(async () => {
    const parsed = legalDraftInputSchema.safeParse(input)
    if (!parsed.success) throw legalError('INVALID_INPUT')
    const user = await requireLegalEditor('draft', LEGAL_WRITES_PER_HOUR)
    const draft = await transaction(tx => createLegalDraft(tx, { actorId: user.id, slug: parsed.data.slug }))
    expireLegalOverview()
    return { versionId: draft.id }
  })

export const saveTranslation = async (input: LegalTranslationInput) =>
  await legalAction(async () => {
    const parsed = legalTranslationInputSchema.safeParse(input)
    if (!parsed.success) throw legalError('INVALID_INPUT')
    const user = await requireLegalEditor('translation', LEGAL_WRITES_PER_HOUR)
    await transaction(tx => saveLegalTranslation(tx, { ...parsed.data, actorId: user.id }))
    expireLegalOverview()
    return null
  })

export const discardDraft = async (input: { versionId: number }) =>
  await legalAction(async () => {
    const parsed = legalVersionInputSchema.safeParse(input)
    if (!parsed.success) throw legalError('INVALID_INPUT')
    await requireLegalEditor('discard', LEGAL_WRITES_PER_HOUR)
    await transaction(tx => discardLegalDraft(tx, parsed.data.versionId))
    expireLegalOverview()
    return null
  })

export const publishVersion = async (input: LegalPublishInput) =>
  await legalAction(async () => {
    const parsed = legalPublishInputSchema.safeParse(input)
    if (!parsed.success) throw legalError('INVALID_INPUT')
    const user = await requireLegalAdmin('publish', LEGAL_PUBLISHES_PER_HOUR)
    const { slug } = await transaction(tx => publishLegalVersion(tx, { ...parsed.data, actorId: user.id }))
    expireLegal(slug)
    return { slug }
  })
