'use server'

import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { cache } from 'react'

import { eq } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { buildCourseWith } from '@/actions/courses/helpers'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { parseCourse } from '@/db/queries/course'
import { courses, skillGroups } from '@/db/schema'
import { CacheTag, courseTag } from '@/lib/cache'

const fetchCourse = cache(async (slug: string, userId?: string) => {
  'use cache'
  cacheTag(courseTag(slug))

  return await safeQuery(async () => {
    const course = await db.query.courses.findFirst({
      where: eq(courses.slug, slug),
      with: buildCourseWith(userId),
    })
    if (!course) throw new Error('Course not found')
    return parseCourse({
      ...course,
      lessons: course.lessons.map(lesson => ({
        ...lesson,
        assessment: lesson.assessments[0] ?? null,
      })),
    })
  })
})

const fetchCourses = cache(async (userId?: string) => {
  'use cache'
  cacheTag(CacheTag.Courses)

  return await safeQuery(async () => {
    const result = await db.query.courses.findMany({ with: buildCourseWith(userId), limit: 200 })
    return result.map(course =>
      parseCourse({
        ...course,
        lessons: course.lessons.map(lesson => ({
          ...lesson,
          assessment: lesson.assessments[0] ?? null,
        })),
      })
    )
  })
})

export const getCourse = async (slug: string, { cache: useCache = true }: { cache?: boolean } = {}) => {
  const authUser = await getAuthUser()
  const userId = authUser?.id
  if (!useCache) {
    return await safeQuery(async () => {
      const course = await db.query.courses.findFirst({
        where: eq(courses.slug, slug),
        with: buildCourseWith(userId),
      })
      if (!course) throw new Error('Course not found')
      return parseCourse({
        ...course,
        lessons: course.lessons.map(lesson => ({
          ...lesson,
          assessment: lesson.assessments[0] ?? null,
        })),
      })
    })
  }
  return await fetchCourse(slug, userId)
}

export const listCourses = async ({ cache: useCache = true }: { cache?: boolean } = {}) => {
  const authUser = await getAuthUser()
  const isEditor = authUser?.role === 'admin' || authUser?.isEditor
  const userId = isEditor ? undefined : authUser?.id
  if (!useCache) {
    return await safeQuery(async () => {
      const result = await db.query.courses.findMany({ with: buildCourseWith(userId), limit: 200 })
      return result.map(course =>
        parseCourse({
          ...course,
          lessons: course.lessons.map(lesson => ({
            ...lesson,
            assessment: lesson.assessments[0] ?? null,
          })),
        })
      )
    })
  }
  return await fetchCourses(userId)
}

export const listSkillGroups = cache(async () => {
  'use cache'
  cacheTag(CacheTag.SkillGroups)
  cacheLife('max')

  return await db.query.skillGroups.findMany({
    columns: { id: true, name: true },
    orderBy: skillGroups.name,
    limit: 100,
  })
})
