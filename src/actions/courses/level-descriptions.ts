import 'server-only'

import { cacheTag } from 'next/cache'
import { cache } from 'react'

import { eq, inArray } from 'drizzle-orm'

import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { parseSkillLevelDescriptions } from '@/db/queries/skill-level-description'
import { assessments, lessons, skillLevelDescriptions } from '@/db/schema'
import { CacheTag } from '@/lib/cache'

const queryLevelDescriptions = async (courseIds: number[]) => {
  if (courseIds.length === 0) return {}
  const rows = await db
    .select({
      courseId: lessons.courseId,
      description: skillLevelDescriptions.description,
      id: skillLevelDescriptions.id,
      level: skillLevelDescriptions.level,
    })
    .from(skillLevelDescriptions)
    .innerJoin(assessments, eq(assessments.id, skillLevelDescriptions.assessmentId))
    .innerJoin(lessons, eq(lessons.id, assessments.lessonId))
    .where(inArray(lessons.courseId, courseIds))
  return parseSkillLevelDescriptions(rows)
}

const fetchCachedLevelDescriptions = cache(async (courseIds: number[]) => {
  'use cache'
  cacheTag(CacheTag.Courses)

  return await safeQuery(() => queryLevelDescriptions(courseIds))
})

export const fetchLevelDescriptions = async (
  courseIds: number[],
  { cache: useCache = true }: { cache?: boolean } = {}
) => {
  const ids = [...new Set(courseIds)].toSorted((a, b) => a - b)
  if (!useCache) return await safeQuery(() => queryLevelDescriptions(ids))
  return await fetchCachedLevelDescriptions(ids)
}
