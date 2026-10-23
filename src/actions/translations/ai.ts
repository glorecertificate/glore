'use server'

import 'server-only'

import { z } from 'zod'

import { requireEditor } from '@/actions/guards'
import { entitySlug, expireTranslationCaches } from '@/actions/translations/effects'
import { describeTargets, loadTargets } from '@/actions/translations/helpers'
import { transaction } from '@/db/client'
import { saveTranslation, writeFields } from '@/db/mutations/content-translation'
import {
  CONTENT_ENTITY_TYPES,
  TARGET_LOCALES,
  type TranslationField,
  localeValue,
} from '@/db/queries/content-translation'
import { AI_ERROR, generateTextWithFallback, resolveAiModels } from '@/lib/ai'
import { DEFAULT_LOCALE } from '@/lib/i18n'
import { isRateLimited } from '@/lib/rate-limit'
import { applySegments, collectSegments, translateSegments } from '@/lib/translate'

const HOUR = 60 * 60 * 1000
const TRANSLATIONS_PER_HOUR = 150
const FIRST_TOKEN_TIMEOUT_MS = 45_000
const MAX_OUTPUT_TOKENS = 8192
const REPLACEABLE = new Set(['machine', 'missing'])

const failure = (code: string) => ({ error: { code, message: code } })

const guard = async () => {
  try {
    return await requireEditor()
  } catch {
    return null
  }
}

const translateSchema = z.object({
  entityId: z.number().int().positive(),
  entityType: z.enum(CONTENT_ENTITY_TYPES),
  locale: z.enum(TARGET_LOCALES),
  overwrite: z.boolean().optional(),
})

const languageName = (locale: string) => new Intl.DisplayNames(['en'], { type: 'language' }).of(locale) ?? locale

const fieldKey = ({ column, id, table }: TranslationField) => `${table}:${id}:${column}`

export const translateEntity = async (input: z.input<typeof translateSchema>) => {
  const user = await guard()
  if (!user) return failure('FORBIDDEN')
  const parsed = translateSchema.safeParse(input)
  if (!parsed.success) return failure('INVALID_INPUT')
  const { entityId, entityType, locale, overwrite } = parsed.data

  const models = resolveAiModels()
  if (!models) return failure(AI_ERROR.notConfigured)
  if (await isRateLimited(`content-translate:${user.id}`, TRANSLATIONS_PER_HOUR, HOUR)) return failure('RATE_LIMITED')

  const targets = await loadTargets(entityType, entityId)
  const target = targets.find(item => item.entityType === entityType && item.entityId === entityId)
  if (!target) return failure('NOT_FOUND')

  const [current] = await describeTargets([target])
  const state = current?.locales.find(item => item.locale === locale)?.state ?? 'missing'
  if (!(overwrite || REPLACEABLE.has(state))) return failure('EXISTS')

  const sources = target.fields.map(field => ({
    field,
    segments: collectSegments(localeValue(field.value, DEFAULT_LOCALE), fieldKey(field)),
  }))
  const segments = sources.flatMap(source => source.segments)
  if (segments.length === 0) return { data: { fields: [], translated: 0 } }

  let output: Awaited<ReturnType<typeof translateSegments>>
  try {
    output = await translateSegments(segments, languageName(DEFAULT_LOCALE), {
      generate: async ({ instructions, prompt }) =>
        (
          await generateTextWithFallback({
            firstTokenTimeoutMs: FIRST_TOKEN_TIMEOUT_MS,
            instructions,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            models,
            prompt,
            temperature: 0.2,
          })
        ).text,
      language: languageName(locale),
    })
  } catch {
    return failure(AI_ERROR.unavailable)
  }
  if (!output.ok) return failure('AI_INVALID')

  const translations = new Map(Object.entries(output.translations))
  const updates = sources.flatMap(({ field, segments: own }) => {
    if (own.length === 0) return []
    const record = (field.value ?? {}) as Record<string, unknown>
    const translated = applySegments(record[DEFAULT_LOCALE], fieldKey(field), translations)
    return [{ column: field.column, id: field.id, table: field.table, value: { ...record, [locale]: translated } }]
  })

  await transaction(async tx => {
    await writeFields(tx, updates)
    await saveTranslation(tx, { locale, mode: 'machine', target, userId: user.id })
  })

  expireTranslationCaches(entityType, await entitySlug(entityType, entityId))
  return {
    data: {
      fields: updates.map(({ column, id, table, value }) => ({ column, id, table, value: value[locale] })),
      translated: segments.length,
    },
  }
}
