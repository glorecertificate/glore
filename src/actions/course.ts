'use server'

import 'server-only'

import { cache } from 'react'

import { type Locale } from 'next-intl'

import { getAuthUser } from '@/actions/auth'
import { getDatabase } from '@/db/client'
import { type Course, courseQuery, parseCourse } from '@/db/queries'
import { type TableInsert, type TableUpdate } from '@/db/types'
import { resolveQuery } from '@/db/utils'

export const findCourse = cache(async (slug: string) => {
  const db = await getDatabase()

  const query = db.from('courses').select(courseQuery).eq('slug', slug).single()
  const { data, error } = await resolveQuery(query, parseCourse)
  if (error) return null

  return data
})

export const listCourses = cache(async () => {
  const db = await getDatabase()

  const query = db.from('courses').select(courseQuery)
  const { data, error } = await resolveQuery(query, parseCourse)
  if (error) throw error

  return data
})

export const createCourse = async (data: TableInsert<'courses'>) => {
  const db = await getDatabase()

  const query = db.from('courses').insert(data).select(courseQuery).single()
  return resolveQuery(query, parseCourse)
}

export const updateCourse = async (id: number, data: TableUpdate<'courses'>) => {
  const db = await getDatabase()
  const query = db.from('courses').update(data).eq('id', id).select(courseQuery).single()

  return resolveQuery(query, parseCourse)
}

export const deleteCourse = async (id: number) => {
  const db = await getDatabase()
  return await db.from('courses').delete().eq('id', id)
}

export const listSkillGroups = cache(async () => {
  const db = await getDatabase()
  const query = db.from('skill_groups').select('id, name').order('name')
  const { data, error } = await resolveQuery(query)
  if (error) throw error
  return data
})

export const enrollUser = async (courseId: number, locale: Locale) => {
  const db = await getDatabase()
  const user = await getAuthUser()
  const query = db.from('user_courses').insert({ course_id: courseId, locale, user_id: user.id }).select().single()
  return resolveQuery(query)
}

export const upsertLessons = async (data: TableInsert<'lessons'>[]) => {
  const db = await getDatabase()
  const query = db.from('lessons').upsert(data).select()
  return resolveQuery(query)
}

export const reorderCourses = async (courses: Course[]) => {
  const db = await getDatabase()
  const updates = courses.map(({ id, slug }, i) => ({ id, slug, sort_order: i + 1 }))
  return db.from('courses').upsert(updates)
}

export const submitAnswers = async (answers: { id: number }[]) => {
  const db = await getDatabase()
  const user = await getAuthUser()
  const query = db
    .from('user_answers')
    .insert(answers.map(({ id }) => ({ option_id: id, user_id: user.id })))
    .select('id')
  return resolveQuery(query)
}
