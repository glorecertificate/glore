'use server'

import 'server-only'

import { cache } from 'react'
import { cacheTag, revalidateTag } from 'next/cache'

import { getAuthUser } from '@/actions/auth'
import { defaultCourse, defaultLesson } from '@/components/features/courses/course-provider'
import { getDatabase } from '@/db/client'
import { type Course, courseQuery, parseCourse } from '@/db/schema/courses'
import { lessonQuery, parseLesson } from '@/db/schema/lessons'
import { type DatabaseQuery, type DatabaseSingleQuery, type TableInsert, type TableUpdate } from '@/db/types'
import { resolveQuery } from '@/db/utils'
import { CacheTag } from '@/lib/cache'

const fetchCourse = async (slug: string, query: DatabaseSingleQuery<'courses', typeof courseQuery>) => {
  'use cache'
  cacheTag(`${CacheTag.Course}-${slug}`)

  return await resolveQuery(query, parseCourse)
}

const fetchCourses = async (query: DatabaseQuery<'courses', typeof courseQuery>) => {
  'use cache'
  cacheTag(CacheTag.Courses)

  return await resolveQuery(query, parseCourse)
}

const fetchSkillGroups = async (query: DatabaseQuery<'skill_groups', 'id, name'>) => {
  'use cache'
  cacheTag(CacheTag.SkillGroups)

  return await resolveQuery(query)
}

export const findCourse = cache(async (slug: string) => {
  const db = await getDatabase()
  const query = db.from('courses').select(courseQuery).eq('slug', slug).single()

  const { data, error } = await fetchCourse(slug, query)
  if (error || !data) return null
  return data
})

export const listCourses = cache(async () => {
  const db = await getDatabase()
  const query = db.from('courses').select(courseQuery)

  const { data, error } = await fetchCourses(query)
  if (error) throw error

  return data
})

export const initializeCourse = async (course: TableInsert<'courses'>) => {
  const { data, error } = await createCourse({
    ...defaultCourse,
    ...course,
  })
  if (error) throw error

  const { data: lessons, error: lessonsError } = await upsertLessons([
    {
      ...defaultLesson,
      course_id: data.id,
      sort_order: 1,
    },
  ])
  if (lessonsError) throw lessonsError

  return { ...data, lessons }
}

export const createCourse = async (course: TableInsert<'courses'>) => {
  const db = await getDatabase()
  const query = db.from('courses').insert(course).select(courseQuery).single()

  const response = await resolveQuery(query, parseCourse)
  if (!response.error) revalidateTag(CacheTag.Courses, 'max')
  return response
}

export const updateCourse = async (id: number, course: TableUpdate<'courses'>) => {
  const db = await getDatabase()
  const query = db.from('courses').update(course).eq('id', id).select(courseQuery).single()

  const { data, error } = await resolveQuery(query, parseCourse)
  if (error) throw error

  revalidateTag(`${CacheTag.Course}-${data.slug}`, 'max')
  revalidateTag(CacheTag.Courses, 'max')
  return data
}

export const deleteCourse = async (id: number) => {
  const db = await getDatabase()
  await db.from('courses').delete().eq('id', id)
  revalidateTag(CacheTag.Courses, 'max')
}

export const listSkillGroups = cache(async () => {
  const db = await getDatabase()
  const query = db.from('skill_groups').select('id, name').order('name')

  const { data, error } = await fetchSkillGroups(query)
  if (error) throw error

  return data
})

export const upsertLessons = async (lessons: TableInsert<'lessons'>[]) => {
  const db = await getDatabase()
  const query = db.from('lessons').upsert(lessons).select(lessonQuery)

  const response = await resolveQuery(query, parseLesson)
  if (response.error) revalidateTag(CacheTag.Courses, 'max')
  return response
}

export const reorderCourses = async (courses: Course[]) => {
  const db = await getDatabase()
  const sorted = courses.map(({ id, slug }, i) => ({ id, slug, sort_order: i + 1 }))
  const query = db.from('courses').upsert(sorted)

  const { data, error } = await resolveQuery(query)
  if (error) throw error

  revalidateTag(CacheTag.Courses, 'max')
  return data
}

export const submitAnswers = async (answers: { id: number }[]) => {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const db = await getDatabase()
  const query = db
    .from('user_answers')
    .insert(answers.map(({ id }) => ({ option_id: id, user_id: user.id })))
    .select('id')

  return resolveQuery(query)
}
