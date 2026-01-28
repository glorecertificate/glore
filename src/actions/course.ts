'use server'

import 'server-only'

import { cache } from 'react'
import { cacheLife, cacheTag, revalidateTag } from 'next/cache'

import { getAuthUser } from '@/actions/auth'
import { getDatabase, getPublicDatabase } from '@/db/client'
import { type Course, courseQuery, parseCourse } from '@/db/queries/course'
import { lessonQuery, parseLesson } from '@/db/queries/lesson'
import { type TableInsert, type TableUpdate } from '@/db/types'
import { CacheTag } from '@/lib/cache'

export const getCourse = cache(async (slug: string) => {
  'use cache'
  cacheTag(`${CacheTag.Course}-${slug}`)

  const db = await getPublicDatabase()
  const { data, error } = await db.from('courses').select(courseQuery).eq('slug', slug).single()
  if (error) throw error

  return parseCourse(data)
})

export const listCourses = cache(async () => {
  'use cache'
  cacheTag(CacheTag.Courses)

  const db = await getPublicDatabase()
  const { data, error } = await db.from('courses').select(courseQuery)
  if (error) throw error

  return data.map(parseCourse)
})

export const listSkillGroups = cache(async () => {
  'use cache'
  cacheTag(CacheTag.SkillGroups)
  cacheLife('max')

  const db = await getPublicDatabase()
  const { data, error } = await db.from('skill_groups').select('id, name').order('name')
  if (error) throw error

  return data
})

export const createCourse = async (course: TableInsert<'courses'>) => {
  const db = await getDatabase()

  const { data, error } = await db.from('courses').insert(course).select(courseQuery).single()
  if (error) throw error

  const lesson = await createLesson({ course_id: data.id, sort_order: 1 })

  revalidateTag(CacheTag.Courses, 'max')
  return { ...parseCourse(data), lessons: [lesson] }
}

export const updateCourse = async (id: number, course: TableUpdate<'courses'>) => {
  const db = await getDatabase()

  const { data, error } = await db.from('courses').update(course).eq('id', id).select(courseQuery).single()
  if (error) throw error

  revalidateTag(CacheTag.Courses, 'max')
  revalidateTag(`${CacheTag.Course}-${data.slug}`, 'max')
  return parseCourse(data)
}

export const deleteCourse = async (id: number) => {
  const db = await getDatabase()

  const { error } = await db.from('courses').delete().eq('id', id)
  if (error) throw error

  revalidateTag(CacheTag.Courses, 'max')
}

export const createLesson = async (lesson: TableInsert<'lessons'>) => {
  const db = await getDatabase()

  const { data, error } = await db.from('lessons').insert(lesson).select(lessonQuery).single()
  if (error) throw error

  revalidateTag(CacheTag.Courses, 'max')
  return parseLesson(data)
}

export const upsertLessons = async (lessons: TableInsert<'lessons'>[]) => {
  const db = await getDatabase()

  const { data, error } = await db.from('lessons').upsert(lessons).select(lessonQuery)
  if (error) throw error

  revalidateTag(CacheTag.Courses, 'max')
  return data.map(parseLesson)
}

export const reorderCourses = async (courses: Course[]) => {
  const db = await getDatabase()

  const sorted = courses.map(({ id, slug }, i) => ({ id, slug, sort_order: i + 1 }))
  const { error } = await db.from('courses').upsert(sorted)
  if (error) throw error

  revalidateTag(CacheTag.Courses, 'max')
}

export const submitAnswers = async (options: { id: number }[]) => {
  const user = await getAuthUser()
  if (!user) throw Error('User not authenticated')

  const db = await getDatabase()
  const answers = options.map(({ id }) => ({ option_id: id, user_id: user.id }))
  const { data, error } = await db.from('user_answers').insert(answers).select('id')
  if (error) throw error

  return data
}
