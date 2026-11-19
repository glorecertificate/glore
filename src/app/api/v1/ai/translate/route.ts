import { type NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { TARGET_LOCALES } from '@/db/queries/content-translation'
import { AI_ERROR, resolveAiModels, streamElementsWithFallback } from '@/lib/ai'
import { authorizeEditorRequest, readJsonBody } from '@/lib/api'
import { LOCALES } from '@/lib/i18n'
import { checkRateLimit } from '@/lib/rate-limit'
import { acquireRunSlot } from '@/lib/run-slots'
import {
  TRANSLATE_CONCURRENCY,
  type TranslateEvent,
  type TranslateField,
  createLimiter,
  fieldCost,
  hasText,
  translateFields,
} from '@/lib/translate'

export const maxDuration = 300

const MAX_BODY_BYTES = 2 * 1024 * 1024
const MAX_FIELDS = 1000
const MAX_RUNS_PER_MINUTE = 12
const MAX_UNITS_PER_HOUR = 3000
const MAX_CONCURRENT_RUNS = 2
const HOUR = 60 * 60 * 1000
const MAX_OUTPUT_TOKENS = 16_384

const localeSchema = z.enum(LOCALES)

const bodySchema = z.object({
  fields: z
    .array(
      z.object({
        existing: z.record(z.string(), z.boolean()).optional(),
        key: z.string().min(1).max(200),
        text: z.unknown(),
      })
    )
    .min(1)
    .max(MAX_FIELDS),
  replace: z.boolean().optional(),
  source: localeSchema,
  targets: z
    .array(localeSchema)
    .min(1)
    .max(TARGET_LOCALES.length + 1),
})

const languageName = (locale: string) => new Intl.DisplayNames(['en'], { type: 'language' }).of(locale) ?? locale

const encoder = new TextEncoder()

export const POST = async (request: NextRequest) => {
  const { response, user } = await authorizeEditorRequest(request, 'ai:translate', MAX_RUNS_PER_MINUTE)
  if (response) return response

  const body = bodySchema.safeParse(await readJsonBody(request, MAX_BODY_BYTES))
  if (!body.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const { fields, replace = false, source } = body.data
  const targets = [...new Set(body.data.targets)]
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const models = resolveAiModels()
  if (!models) return NextResponse.json({ error: AI_ERROR.notConfigured }, { status: 503 })

  const skips: Extract<TranslateEvent, { status: 'skipped' }>[] = []
  const work = new Map<string, TranslateField[]>()
  try {
    for (const locale of targets) {
      for (const field of fields) {
        if (locale === source) {
          skips.push({ key: field.key, locale, reason: 'same_locale', status: 'skipped', type: 'field' })
          continue
        }
        if (!hasText(field.text)) {
          skips.push({ key: field.key, locale, reason: 'empty_source', status: 'skipped', type: 'field' })
          continue
        }
        if (field.existing?.[locale] && !replace) {
          skips.push({ key: field.key, locale, reason: 'exists', status: 'skipped', type: 'field' })
          continue
        }
        work.set(locale, [...(work.get(locale) ?? []), { key: field.key, text: field.text }])
      }
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const release = acquireRunSlot(user.id, MAX_CONCURRENT_RUNS)
  if (!release) return NextResponse.json({ error: 'TOO_MANY_RUNS' }, { status: 429 })

  let cost = 0
  try {
    cost = [...work.values()].reduce(
      (sum, list) => sum + list.reduce((total, item) => total + fieldCost(item.text), 0),
      0
    )
  } catch {
    release()
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  if (cost > 0) {
    const { limited } = await checkRateLimit(`ai-translate-fields:${user.id}`, MAX_UNITS_PER_HOUR, HOUR, cost)
    if (limited) {
      release()
      return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 })
    }
  }

  const controller = new AbortController()
  const signal = AbortSignal.any([request.signal, controller.signal])
  const limit = createLimiter(TRANSLATE_CONCURRENCY)

  const stream = new ReadableStream<Uint8Array>({
    cancel: () => {
      controller.abort()
      release()
    },
    start: async channel => {
      const send = (event: TranslateEvent) => {
        if (signal.aborted) return
        channel.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      }
      const counts = { failed: 0, ok: 0, skipped: skips.length }
      send({ targets, total: fields.length * targets.length, type: 'start' })
      for (const skip of skips) send(skip)

      try {
        await Promise.all(
          [...work].map(([locale, list]) =>
            translateFields(list, {
              generate: ({ instructions, prompt, signal: abortSignal }) =>
                streamElementsWithFallback({
                  abortSignal,
                  instructions,
                  maxOutputTokens: MAX_OUTPUT_TOKENS,
                  models,
                  prompt,
                  temperature: 0.2,
                }),
              language: languageName(locale),
              limit,
              onField: outcome => {
                if (!outcome.ok) {
                  counts.failed += 1
                  send({ key: outcome.key, locale, reason: outcome.reason, status: 'failed', type: 'field' })
                  return
                }
                counts.ok += 1
                send({
                  key: outcome.key,
                  locale,
                  status: 'ok',
                  type: 'field',
                  value: outcome.value,
                })
              },
              signal,
              sourceLanguage: languageName(source),
            })
          )
        )
        send({ ...counts, type: 'done' })
      } catch {
        send({ code: AI_ERROR.unavailable, type: 'error' })
        controller.abort()
      }
      release()
      try {
        channel.close()
      } catch {
        controller.abort()
      }
    },
  })

  return new Response(stream, {
    headers: { 'cache-control': 'no-store', 'content-type': 'application/x-ndjson; charset=utf-8' },
  })
}
