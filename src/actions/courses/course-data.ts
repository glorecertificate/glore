import 'server-only'

import { cacheTag } from 'next/cache'
import { cache } from 'react'

import { eq } from 'drizzle-orm'

import { buildCourseWith } from '@/actions/courses/helpers'
import { getViewer } from '@/actions/viewer'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { parseCourse } from '@/db/queries/course'
import { courses } from '@/db/schema'
import { courseTag, progressUserTag } from '@/lib/cache'

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

export const loadCourse = async (slug: string) => {
  const user = await getViewer()
  return await fetchCourse(slug, user.id, !user.canEdit)
}
