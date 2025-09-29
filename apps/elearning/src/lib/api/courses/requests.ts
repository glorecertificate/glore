import { serialize } from '@repo/utils/serialize'

import { getCurrent as getCurrentUser } from '@/lib/api/users/requests'
import type { UserAnswer, UserAssessment, UserCourse, UserEvaluation, UserLesson } from '@/lib/api/users/types'
import { type DatabaseClient } from '@/lib/db/types'
import { DatabaseError } from '@/lib/db/utils'
import { getLocale } from '@/lib/i18n'

import { parseCourse } from './parser'
import { courseQuery } from './queries'
import type { Course, CourseCreate, CourseUpdate } from './types'

export const list = async (db: DatabaseClient): Promise<Course[]> => {
  const { data, error } = await db.from('courses').select(courseQuery)

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return data.map(course => parseCourse(course))
}

export const find = async (db: DatabaseClient, slug: string): Promise<Course> => {
  const { data, error } = await db.from('courses').select(courseQuery).eq('slug', slug).single()

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return parseCourse(data)
}

export const create = async (db: DatabaseClient, course: CourseCreate): Promise<Course> => {
  const { data, error } = await db.from('courses').insert(course).select(courseQuery).single()

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return parseCourse(data)
}

export const update = async (db: DatabaseClient, course: CourseUpdate): Promise<Course> => {
  const { id, ...updates } = course
  const { data, error } = await db.from('courses').update(updates).eq('id', id).select(courseQuery).single()

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return parseCourse(data)
}

export const enrollUser = async (db: DatabaseClient, courseId: number): Promise<UserCourse> => {
  const user = await getCurrentUser(db)
  const locale = await getLocale()

  const { data, error } = await db
    .from('user_courses')
    .insert({ user_id: user.id, course_id: courseId, locale })
    .select()

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return serialize(data[0])
}

export const completeLesson = async (db: DatabaseClient, id: number): Promise<UserLesson> => {
  const user = await getCurrentUser(db)

  const { data, error } = await db
    .from('user_lessons')
    .upsert([{ user_id: user.id, lesson_id: id }])
    .select('id')

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return serialize(data[0])
}

export const submitAnswers = async (db: DatabaseClient, answers: { id: number }[]): Promise<UserAnswer[]> => {
  const user = await getCurrentUser(db)

  const { data, error } = await db
    .from('user_answers')
    .insert(answers.map(({ id }) => ({ user_id: user.id, option_id: id })))
    .select('id')

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return serialize(data)
}

export const submitEvaluations = async (
  db: DatabaseClient,
  evaluations: { id: number; value: number }[],
): Promise<UserEvaluation[]> => {
  const user = await getCurrentUser(db)

  const { data, error } = await db
    .from('user_evaluations')
    .insert(evaluations.map(({ id, value }) => ({ user_id: user.id, evaluation_id: id, value })))
    .select('id, value')

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return serialize(data)
}

export const submitAssessment = async (db: DatabaseClient, id: number, value: number): Promise<UserAssessment> => {
  const user = await getCurrentUser(db)

  const { data, error } = await db
    .from('user_assessments')
    .insert({
      assessment_id: id,
      user_id: user.id,
      value,
    })
    .select('id, value')
    .single()

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return serialize(data)
}
