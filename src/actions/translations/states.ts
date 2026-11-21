'use server'

import 'server-only'

import { z } from 'zod'

import { requireEditor } from '@/actions/guards'
import { entitySlug, expireTranslationCaches, markEdited } from '@/actions/translations/effects'
import { loadCourseTargets } from '@/actions/translations/helpers'
import { transaction } from '@/db/client'
import { TARGET_LOCALES } from '@/db/queries/content-translation'

const failure = (code: string) => ({ error: { code, message: code } })

const guard = async () => {
  try {
    return await requireEditor()
  } catch {
    return null
  }
}

const editedSchema = z.object({
  course: z.boolean(),
  courseId: z.number().int().positive(),
  lessonIds: z.array(z.number().int().positive()).max(500),
  locale: z.enum(TARGET_LOCALES),
})

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
