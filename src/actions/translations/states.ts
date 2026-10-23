'use server'

import 'server-only'

import { z } from 'zod'

import { requireEditor } from '@/actions/guards'
import { entitySlug, expireTranslationCaches, markEdited } from '@/actions/translations/effects'
import { describeTargets, loadCourseTargets, loadTargets } from '@/actions/translations/helpers'
import { transaction } from '@/db/client'
import { mapSequential } from '@/db/helpers'
import { recordEvent } from '@/db/mutations/activity-event'
import { saveTranslation } from '@/db/mutations/content-translation'
import { CONTENT_ENTITY_TYPES, TARGET_LOCALES, hasLocaleContent } from '@/db/queries/content-translation'

const failure = (code: string) => ({ error: { code, message: code } })

const guard = async () => {
  try {
    return await requireEditor()
  } catch {
    return null
  }
}

const entitySchema = z.object({
  entityId: z.number().int().positive(),
  entityType: z.enum(CONTENT_ENTITY_TYPES),
})

const reviewSchema = entitySchema.extend({ locale: z.enum(TARGET_LOCALES) })

const editedSchema = z.object({
  course: z.boolean(),
  courseId: z.number().int().positive(),
  lessonIds: z.array(z.number().int().positive()).max(500),
  locale: z.enum(TARGET_LOCALES),
})

export const listTranslationStates = async (input: z.input<typeof entitySchema>) => {
  if (!(await guard())) return failure('FORBIDDEN')
  const parsed = entitySchema.safeParse(input)
  if (!parsed.success) return failure('INVALID_INPUT')
  const targets = await loadTargets(parsed.data.entityType, parsed.data.entityId)
  if (targets.length === 0) return failure('NOT_FOUND')
  return { data: await describeTargets(targets) }
}

export const reviewTranslation = async (input: z.input<typeof reviewSchema>) => {
  const user = await guard()
  if (!user) return failure('FORBIDDEN')
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) return failure('INVALID_INPUT')
  const { entityId, entityType, locale } = parsed.data

  const [targets, slug] = await Promise.all([loadTargets(entityType, entityId), entitySlug(entityType, entityId)])
  const reviewable = targets.filter(target => hasLocaleContent(target, locale))
  if (!slug || targets.length === 0) return failure('NOT_FOUND')
  if (reviewable.length === 0) return failure('EMPTY')

  await transaction(async tx => {
    await mapSequential(reviewable, target =>
      saveTranslation(tx, { locale, mode: 'reviewed', target, userId: user.id })
    )
    await recordEvent(tx, {
      actorId: user.id,
      data: { count: reviewable.length, entityId, entityType, locale, slug },
      organizationId: null,
      type: 'content.translation_reviewed',
    })
  })

  expireTranslationCaches(entityType, slug)
  return { data: { reviewed: reviewable.length } }
}

export const markTranslationsEdited = async (input: z.input<typeof editedSchema>) => {
  const user = await guard()
  if (!user) return failure('FORBIDDEN')
  const parsed = editedSchema.safeParse(input)
  if (!parsed.success) return failure('INVALID_INPUT')
  const { course, courseId, lessonIds, locale } = parsed.data

  const targets = await loadCourseTargets(courseId)
  const edited = targets.filter(target =>
    target.entityType === 'course' ? course : lessonIds.includes(target.entityId)
  )
  if (edited.length === 0) return { data: { marked: 0 } }

  await transaction(tx => markEdited(tx, edited, locale, user.id))
  expireTranslationCaches('course', await entitySlug('course', courseId))
  return { data: { marked: edited.length } }
}
