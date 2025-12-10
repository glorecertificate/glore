import { cache } from 'react'

import type { Locale } from 'next-intl'

import { getCurrentUser } from '@/lib/actions/user'
import { type Course, courseQuery, parseCourse } from '@/lib/db/schema'
import { getSupabaseClient } from '@/lib/db/server'
import type { DatabaseInsert, DatabaseUpdate } from '@/lib/db/types'
import { resolveSupabaseResponse } from '@/lib/db/utils'

export const findCourse = cache(async (slug: string) => {
  const supabase = await getSupabaseClient()
  const response = await supabase.from('courses').select(courseQuery).eq('slug', slug).single()
  return resolveSupabaseResponse(response, { parser: parseCourse })
})

export const listCourses = cache(async () => {
  const supabase = await getSupabaseClient()
  const response = await supabase.from('courses').select(courseQuery)
  return resolveSupabaseResponse(response, { parser: parseCourse })
})

export const createCourse = async (data: DatabaseInsert<'courses'>) => {
  const supabase = await getSupabaseClient()
  const response = await supabase.from('courses').insert(data).select(courseQuery).single()
  return resolveSupabaseResponse(response, { parser: parseCourse })
}

export const updateCourse = async (id: number, data: DatabaseUpdate<'courses'>) => {
  const supabase = await getSupabaseClient()
  const response = await supabase.from('courses').update(data).eq('id', id).select(courseQuery).single()
  return resolveSupabaseResponse(response, { parser: parseCourse })
}

export const deleteCourse = async (id: number) => {
  const supabase = await getSupabaseClient()
  await supabase.from('courses').delete().eq('id', id)
  return null
}

export const listSkillGroups = async () => {
  const supabase = await getSupabaseClient()
  const response = await supabase.from('skill_groups').select('id, name').order('name')
  return resolveSupabaseResponse(response)
}

export const enrollUser = async (courseId: number, locale: Locale) => {
  const user = await getCurrentUser()
  const supabase = await getSupabaseClient()
  const response = await supabase
    .from('user_courses')
    .insert({ course_id: courseId, locale, user_id: user.id })
    .select()
  return resolveSupabaseResponse(response)
}

export const upsertLessons = async (data: DatabaseInsert<'lessons'>[]) => {
  const supabase = await getSupabaseClient()
  const response = await supabase.from('lessons').upsert(data).select()
  return resolveSupabaseResponse(response)
}

export const reorderCourses = async (courses: Course[]) => {
  const supabase = await getSupabaseClient()
  const updates = courses.map(({ id, slug }, i) => ({ id, slug, sort_order: i + 1 }))
  const response = await supabase.from('courses').upsert(updates)
  return resolveSupabaseResponse(response)
}

export const submitAnswers = async (answers: { id: number }[]) => {
  const supabase = await getSupabaseClient()
  const user = await getCurrentUser()
  const response = await supabase
    .from('user_answers')
    .insert(answers.map(({ id }) => ({ option_id: id, user_id: user.id })))
    .select('id')
  return resolveSupabaseResponse(response)
}
