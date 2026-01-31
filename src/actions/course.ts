'use server'

import 'server-only'

import { cache } from 'react'
import { cacheLife, cacheTag, revalidateTag } from 'next/cache'

import { getAuthUser } from '@/actions/auth'
import { getDatabase, getPublicDatabase } from '@/db/client'
import { type Course, courseQuery, parseCourse } from '@/db/queries/course'
import { DEFAULT_LESSON, lessonQuery, parseLesson } from '@/db/queries/lesson'
import { type TableInsert, type TableUpdate } from '@/db/types'
import { CacheTag } from '@/lib/cache'

export const getCourse = cache(async (slug: string) => {
  'use cache'
  cacheTag(`${CacheTag.Course}-${slug}`)

  const db = await getPublicDatabase()

  const { data, error } = await db.from('courses').select(courseQuery).eq('slug', slug).single()
  if (error) return { error }

  return { data: parseCourse(data) }
})

export const listCourses = cache(async () => {
  'use cache'
  cacheTag(CacheTag.Courses)

  const db = await getPublicDatabase()

  const { data, error } = await db.from('courses').select(courseQuery)
  if (error) return { error }

  return { data: data.map(parseCourse) }
})

export const listSkillGroups = cache(async () => {
  'use cache'
  cacheTag(CacheTag.SkillGroups)
  cacheLife('max')

  const db = await getPublicDatabase()
  return await db.from('skill_groups').select('id, name').order('name')
})

export const createCourse = async (course: TableInsert<'courses'>) => {
  const db = await getDatabase()

  const { data, error } = await db.from('courses').insert(course).select(courseQuery).single()
  if (error) return { error }

  const { data: lesson, error: lessonError } = await createLesson({
    course_id: data.id,
    sort_order: 1,
    title: DEFAULT_LESSON.title,
    content: DEFAULT_LESSON.content,
  })
  if (lessonError) {
    await db.from('courses').delete().eq('id', data.id)
    return { error: lessonError }
  }

  revalidateTag(CacheTag.Courses, 'max')
  return { data: { ...parseCourse(data), lessons: [lesson] } }
}

export const updateCourse = async (id: number, course: TableUpdate<'courses'>) => {
  const db = await getDatabase()

  const { data, error } = await db.from('courses').update(course).eq('id', id).select(courseQuery).single()
  if (error) return { error }

  revalidateTag(CacheTag.Courses, 'max')
  revalidateTag(`${CacheTag.Course}-${data.slug}`, 'max')
  return { data: parseCourse(data) }
}

export const deleteCourse = async (id: number) => {
  const db = await getDatabase()

  const { error } = await db.from('courses').delete().eq('id', id)
  if (error) return { error }

  revalidateTag(CacheTag.Courses, 'max')
  return { data: true }
}

export const createLesson = async (lesson: TableInsert<'lessons'>) => {
  const db = await getDatabase()

  const { data, error } = await db.from('lessons').insert(lesson).select(lessonQuery).single()
  if (error) return { error }

  revalidateTag(CacheTag.Courses, 'max')
  return { data: parseLesson(data) }
}

export const upsertLessons = async (lessons: TableInsert<'lessons'>[]) => {
  const db = await getDatabase()

  const { data, error } = await db.from('lessons').upsert(lessons).select(lessonQuery)
  if (error) return { error }

  revalidateTag(CacheTag.Courses, 'max')
  return { data: data.map(parseLesson) }
}

export const reorderCourses = async (courses: Course[]) => {
  const db = await getDatabase()

  const { data, error } = await db.from('courses').upsert(
    courses.map(({ id, slug, type }, i) => ({
      id,
      slug,
      type,
      sort_order: i + 1,
    }))
  )
  if (error) return { error }

  revalidateTag(CacheTag.Courses, 'max')
  return { data }
}

export const upsertQuestions = async (questions: TableInsert<'questions'>[]) => {
  const db = await getDatabase()

  const { data, error } = await db.from('questions').upsert(questions).select('id, description, explanation')
  if (error) return { error }

  revalidateTag(CacheTag.Courses, 'max')
  return { data }
}

export const deleteQuestions = async (ids: number[]) => {
  const db = await getDatabase()

  const { error } = await db.from('questions').delete().in('id', ids)
  if (error) return { error }

  revalidateTag(CacheTag.Courses, 'max')
  return { data: true }
}

export const upsertEvaluations = async (evaluations: TableInsert<'evaluations'>[]) => {
  const db = await getDatabase()

  const { data, error } = await db.from('evaluations').upsert(evaluations).select('id, description')
  if (error) return { error }

  revalidateTag(CacheTag.Courses, 'max')
  return { data }
}

export const deleteEvaluations = async (ids: number[]) => {
  const db = await getDatabase()

  const { error } = await db.from('evaluations').delete().in('id', ids)
  if (error) return { error }

  revalidateTag(CacheTag.Courses, 'max')
  return { data: true }
}

export const upsertAssessment = async (assessment: TableInsert<'assessments'>) => {
  const db = await getDatabase()

  const { data, error } = await db.from('assessments').upsert(assessment).select('id, description').single()
  if (error) return { error }

  revalidateTag(CacheTag.Courses, 'max')
  return { data }
}

export const deleteAssessment = async (id: number) => {
  const db = await getDatabase()

  const { error } = await db.from('assessments').delete().eq('id', id)
  if (error) return { error }

  revalidateTag(CacheTag.Courses, 'max')
  return { data: true }
}

export const submitAnswers = async (options: { id: number }[]) => {
  const user = await getAuthUser()
  if (!user) return { error: new Error('Unauthorized') }

  const db = await getDatabase()

  return await db
    .from('user_answers')
    .insert(options.map(({ id }) => ({ option_id: id, user_id: user.id })))
    .select('id')
}
