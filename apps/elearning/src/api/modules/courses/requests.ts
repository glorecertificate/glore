import { serialize } from '@repo/utils'

import { getSession } from '@/api/modules/auth/requests'
import { db } from '@/lib/db/client'
import { createDatabaseClient } from '@/lib/db/server'
import { DatabaseError, PostgRESTCode } from '@/lib/db/utils'

import { parseCourse } from './parser'
import { courseQuery } from './queries'
import type { Course, UserAnswer, UserAssessment, UserCourse, UserEvaluation, UserLesson } from './types'

export const list = async (): Promise<Course[]> => {
  const db = await createDatabaseClient()

  const { data, error } = await db.from('courses').select(courseQuery)

  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

  return data.map(course => parseCourse(course))
}

export const get = async (slug: string): Promise<Course> => {
  const db = await createDatabaseClient()

  const { data, error } = await db.from('courses').select(courseQuery).eq('slug', slug).single()

  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

  return parseCourse(data)
}

export const enrollUser = async (courseId: number): Promise<UserCourse> => {
  const db = await createDatabaseClient()
  const session = await getSession()

  const { data, error } = await db
    .from('user_courses')
    .insert({ user_id: session.user.id, course_id: courseId })
    .select()

  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

  return serialize(data[0])
}

export const completeLesson = async (id: number): Promise<UserLesson> => {
  const session = await getSession()

  const { data, error } = await db
    .from('user_lessons')
    .upsert([{ user_id: session.user.id, lesson_id: id }])
    .select('id')

  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

  return serialize(data[0])
}

export const submitAnswers = async (answers: Array<{ id: number }>): Promise<UserAnswer[]> => {
  const session = await getSession()

  const { data, error } = await db
    .from('user_answers')
    .insert(answers.map(({ id }) => ({ user_id: session.user.id, option_id: id })))
    .select('id')

  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

  return serialize(data)
}

export const submitEvaluations = async (
  evaluations: Array<{ id: number; value: number }>,
): Promise<UserEvaluation[]> => {
  const session = await getSession()

  const { data, error } = await db
    .from('user_evaluations')
    .insert(evaluations.map(({ id, value }) => ({ user_id: session.user.id, evaluation_id: id, value })))
    .select('id, value')

  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

  return serialize(data)
}

export const submitAssessment = async (id: number, value: number): Promise<UserAssessment> => {
  const session = await getSession()

  const { data, error } = await db
    .from('user_assessments')
    .insert({
      user_id: session.user.id,
      assessment_id: id,
      value,
    })
    .select('id, value')
    .single()

  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

  return serialize(data)
}
