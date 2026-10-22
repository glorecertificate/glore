'use server'

import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { cache } from 'react'

import { asc, eq } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { buildCourseWith, fetchCourses, queryCatalog } from '@/actions/courses/helpers'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { parseCourse } from '@/db/queries/course'
import { courses, skillGroups } from '@/db/schema'
import { CacheTag, courseTag, progressUserTag } from '@/lib/cache'

const queryCourse = async (slug: string, userId: string | undefined, catalog: boolean) => {
  const course = await db.query.courses.findFirst({
    where: eq(courses.slug, slug),
    with: buildCourseWith(userId, { catalog }),
  })
  if (!course) throw new Error('Course not found')
  return parseCourse({
    ...course,
    lessons: course.lessons.map(lesson => ({
      ...lesson,
      assessment: lesson.assessments[0] ?? null,
    })),
  })
}

const fetchCourse = cache(async (slug: string, userId: string | undefined, catalog: boolean) => {
  'use cache'
  cacheTag(courseTag(slug), ...(userId ? [progressUserTag(userId)] : []))

  return await safeQuery(() => queryCourse(slug, userId, catalog))
})

export const getCourse = async (slug: string, { cache: useCache = true }: { cache?: boolean } = {}) => {
  const authUser = await getAuthUser()
  const userId = authUser?.id
  const catalog = !(authUser?.role === 'admin' || authUser?.isEditor)
  if (!useCache) return await safeQuery(() => queryCourse(slug, userId, catalog))
  return await fetchCourse(slug, userId, catalog)
}

export const listCourses = async ({ cache: useCache = true }: { cache?: boolean } = {}) => {
  const authUser = await getAuthUser()
  const isEditor = authUser?.role === 'admin' || authUser?.isEditor
  const userId = isEditor ? undefined : authUser?.id
  if (!useCache) return await safeQuery(() => queryCatalog(userId))
  return await fetchCourses(userId)
}

export const listSkillGroups = cache(async () => {
  'use cache'
  cacheTag(CacheTag.SkillGroups)
  cacheLife('max')

  return await db.query.skillGroups.findMany({
    columns: { id: true, name: true, slug: true },
    orderBy: [asc(skillGroups.sortOrder), asc(skillGroups.id)],
    limit: 100,
  })
})
