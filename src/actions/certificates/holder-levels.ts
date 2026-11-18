import 'server-only'

import { asc, eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { type SkillLevel } from '@/db/queries/skill-level-description'
import { assessments, lessons, userAssessments } from '@/db/schema'

export const holderAssessments = async (userId: string) =>
  await db
    .select({ courseId: lessons.courseId, reflection: userAssessments.reflection, value: userAssessments.value })
    .from(userAssessments)
    .innerJoin(assessments, eq(assessments.id, userAssessments.assessmentId))
    .innerJoin(lessons, eq(lessons.id, assessments.lessonId))
    .where(eq(userAssessments.userId, userId))
    .orderBy(asc(userAssessments.updatedAt))

export const findHolderLevels = async (userId: string) => {
  const rows = await holderAssessments(userId)
  return Object.fromEntries(rows.map(({ courseId, value }) => [courseId, value])) as Record<number, SkillLevel>
}
