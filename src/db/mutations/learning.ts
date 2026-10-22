import 'server-only'

import { and, count, eq, isNull } from 'drizzle-orm'

import { type Transaction, db } from '@/db/client'
import {
  courseRatings,
  lessons,
  userAnswers,
  userAssessments,
  userCourses,
  userEvaluations,
  userLessons,
  userSkillCompass,
} from '@/db/schema'

export const saveAnswer = async (userId: string, optionId: number) => {
  await db.insert(userAnswers).values({ optionId, userId }).onConflictDoNothing()
}

interface LessonCompletion {
  assessment: { assessmentId: number; reflection: string; value: number } | null
  courseId: number
  lessonId: number
  ratings: { evaluationId: number; value: number }[]
  userId: string
}

export const completeLessonRecords = async (
  tx: Transaction,
  { assessment, courseId, lessonId, ratings, userId }: LessonCompletion
) => {
  if (ratings.length > 0) {
    await tx
      .insert(userEvaluations)
      .values(ratings.map(({ evaluationId, value }) => ({ evaluationId, userId, value })))
      .onConflictDoNothing()
  }
  if (assessment) {
    await tx
      .insert(userAssessments)
      .values({
        assessmentId: assessment.assessmentId,
        reflection: assessment.reflection,
        userId,
        value: assessment.value,
      })
      .onConflictDoNothing()
  }
  await tx.insert(userLessons).values({ lessonId, userId }).onConflictDoNothing()

  const [counts] = await tx
    .select({ done: count(userLessons.id), total: count(lessons.id) })
    .from(lessons)
    .leftJoin(userLessons, and(eq(userLessons.lessonId, lessons.id), eq(userLessons.userId, userId)))
    .where(eq(lessons.courseId, courseId))
  const finished = !!counts && counts.total > 0 && counts.done === counts.total

  const [enrollment] = await tx
    .update(userCourses)
    .set(finished ? { completedAt: new Date().toISOString(), lastLessonId: lessonId } : { lastLessonId: lessonId })
    .where(
      and(
        eq(userCourses.userId, userId),
        eq(userCourses.courseId, courseId),
        ...(finished ? [isNull(userCourses.completedAt)] : [])
      )
    )
    .returning({ id: userCourses.id })

  return { courseCompleted: finished && !!enrollment }
}

export const saveCourseRating = async ({
  comment,
  courseId,
  rating,
  userId,
}: {
  comment: string | null
  courseId: number
  rating: number
  userId: string
}) => {
  await db
    .insert(courseRatings)
    .values({ comment, courseId, rating, userId })
    .onConflictDoUpdate({
      set: { comment, rating, updatedAt: new Date().toISOString() },
      target: [courseRatings.userId, courseRatings.courseId],
    })
}

export const replaceSkillCompass = async (
  tx: Transaction,
  { goals, strengths, userId }: { goals: number[]; strengths: number[]; userId: string }
) => {
  await tx.delete(userSkillCompass).where(eq(userSkillCompass.userId, userId))
  const rows = [
    ...strengths.map(courseId => ({ courseId, kind: 'strength' as const, userId })),
    ...goals.map(courseId => ({ courseId, kind: 'goal' as const, userId })),
  ]
  if (rows.length > 0) await tx.insert(userSkillCompass).values(rows)
}
