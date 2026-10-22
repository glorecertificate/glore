'use server'

import 'server-only'

import { revalidateTag, updateTag } from 'next/cache'

import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

import { type Learner, finishLesson, gradeAnswer, rateCompletedCourse } from '@/actions/courses/learning'
import { notify } from '@/actions/notifications/notify'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'
import { db } from '@/db/client'
import { enrollableTypes } from '@/db/queries/learning'
import { courses, userCourses } from '@/db/schema'
import { CacheTag, certificatesUserTag, courseTag, progressUserTag } from '@/lib/cache'
import { LOCALES } from '@/lib/i18n'

const MAX_BATCH = 100

const forbidden = () => ({ error: { code: 'FORBIDDEN', message: 'Not allowed' } })
const invalidInput = () => ({ error: { code: 'INVALID_INPUT', message: 'Invalid values' } })

const idSchema = z.number().int().positive()
const languageSchema = z.enum(LOCALES)
const answerSchema = z.object({ language: languageSchema, optionId: idSchema, questionId: idSchema })
const completionSchema = z.object({
  assessment: z.object({ reflection: z.string().max(5000), value: z.number().int() }).optional(),
  language: languageSchema,
  lessonId: idSchema,
  ratings: z
    .array(z.object({ evaluationId: idSchema, value: z.number().int() }))
    .max(MAX_BATCH)
    .optional(),
})

const ratingSchema = z.object({
  comment: z.string().max(2000).nullish(),
  courseId: idSchema,
  rating: z.number().int(),
})

const currentLearner = async (): Promise<Learner | null> => {
  const user = await getCurrentUser()
  if (user.banned) return null
  const organizationId = await getActiveOrgId()
  const role = user.organizations.find(({ id }) => id === organizationId)?.role ?? null
  return { canEdit: user.canEdit, organizationId, role, userId: user.id }
}

export const startCourse = async (courseId: number, locale: string) => {
  const parsed = z.object({ courseId: idSchema, locale: z.enum(LOCALES) }).safeParse({ courseId, locale })
  if (!parsed.success) return invalidInput()

  const user = await getCurrentUser()
  if (user.banned) return forbidden()

  const existing = await db.query.userCourses.findFirst({
    where: and(eq(userCourses.userId, user.id), eq(userCourses.courseId, courseId)),
  })
  if (existing) return { data: existing }

  const course = await db.query.courses.findFirst({
    where: and(eq(courses.id, courseId), isNull(courses.archivedAt)),
    columns: { languages: true, type: true },
  })
  const enrollmentLocale = course?.languages?.includes(parsed.data.locale) ? parsed.data.locale : course?.languages?.[0]
  if (!(course && enrollmentLocale)) return forbidden()

  const orgId = await getActiveOrgId()
  const role = user.organizations.find(({ id }) => id === orgId)?.role
  if (!role) return forbidden()
  if (!enrollableTypes(role).includes(course.type ?? 'intro')) return forbidden()

  const [result] = await db
    .insert(userCourses)
    .values({ userId: user.id, courseId, locale: enrollmentLocale })
    .onConflictDoNothing()
    .returning()

  updateTag(progressUserTag(user.id))
  return { data: result }
}

export const setCourseLanguage = async (courseId: number, locale: string) => {
  const parsed = z.object({ courseId: idSchema, locale: languageSchema }).safeParse({ courseId, locale })
  if (!parsed.success) return invalidInput()
  const learner = await currentLearner()
  if (!learner) return forbidden()

  const course = await db.query.courses.findFirst({ columns: { languages: true }, where: eq(courses.id, courseId) })
  if (!course?.languages?.includes(parsed.data.locale)) return invalidInput()

  await db
    .update(userCourses)
    .set({ locale: parsed.data.locale })
    .where(and(eq(userCourses.userId, learner.userId), eq(userCourses.courseId, courseId)))
  updateTag(progressUserTag(learner.userId))
  return { data: { locale: parsed.data.locale } }
}

export const answerQuestion = async (input: z.input<typeof answerSchema>) => {
  const parsed = answerSchema.safeParse(input)
  if (!parsed.success) return invalidInput()
  const learner = await currentLearner()
  if (!learner) return forbidden()

  const result = await gradeAnswer(learner, parsed.data)
  if ('error' in result) return { error: { code: result.error, message: 'Answer rejected' } }
  if (result.data.saved) updateTag(progressUserTag(learner.userId))
  return { data: result.data }
}

export const completeLesson = async (input: z.input<typeof completionSchema>) => {
  const parsed = completionSchema.safeParse(input)
  if (!parsed.success) return invalidInput()
  const learner = await currentLearner()
  if (!learner) return forbidden()

  const result = await finishLesson(learner, parsed.data)
  if ('error' in result) return { error: { code: result.error, message: 'Lesson not completed' } }
  if (!result.data.saved) return { data: { courseCompleted: false, saved: false } }

  revalidateTag(certificatesUserTag(learner.userId), 'max')
  updateTag(progressUserTag(learner.userId))
  await Promise.all(result.data.events.map(event => notify(event)))
  return { data: { courseCompleted: result.data.courseCompleted, saved: true } }
}

export const rateCourse = async (input: z.input<typeof ratingSchema>) => {
  const parsed = ratingSchema.safeParse(input)
  if (!parsed.success) return invalidInput()
  const learner = await currentLearner()
  if (!learner) return forbidden()

  const result = await rateCompletedCourse(learner, parsed.data)
  if ('error' in result) return { error: { code: result.error, message: 'Rating rejected' } }

  updateTag(courseTag(result.data.slug))
  updateTag(CacheTag.Courses)
  return { data: { saved: true } }
}
