import { serialize } from '@glore/utils/serialize'

import { createDatabase } from '../../supabase/client'
import { getCurrentUser } from '../users/server'
import { type UserAnswer, type UserAssessment, type UserEvaluation, type UserLesson } from '../users/types'
import { createRepositoryRunner, expectList, expectSingle } from '../utils'
import { DEFAULT_COURSE_TITLE } from './constants'
import { courseQuery } from './queries'
import { type Course, type CourseSettings, type SkillGroup, type UpdateCourseOptions } from './types'
import { parseCourse } from './utils'

const run = createRepositoryRunner(createDatabase)

export const createCourse = async (
  course: CourseSettings & {
    title?: Course['title']
  }
): Promise<Course> =>
  run(async database => {
    const result = await database
      .from('courses')
      .insert({ ...course, title: course.title ?? DEFAULT_COURSE_TITLE })
      .select(courseQuery)
      .single()
    return parseCourse(expectSingle(result))
  })

export const updateCourse = async (course: UpdateCourseOptions): Promise<Course> =>
  run(async database => {
    const { id, ...updates } = course
    const result = await database.from('courses').update(updates).eq('id', id).select(courseQuery).single()
    return parseCourse(expectSingle(result))
  })

export const updateCourseSettings = async (id: number, settings: CourseSettings): Promise<Course> =>
  run(async database => {
    const result = await database.from('courses').update(settings).eq('id', id).select(courseQuery).single()
    return parseCourse(expectSingle(result))
  })

export const deleteCourse = async (id: number): Promise<void> =>
  run(async database => {
    const { error } = await database.from('courses').delete().eq('id', id)
    if (error) throw error
  })

export const getSkillGroups = async (): Promise<SkillGroup[]> =>
  run(async database => {
    const result = await database.from('skill_groups').select('id, name').order('name')
    return serialize(expectList(result))
  })

export const completeLesson = async (id: number): Promise<UserLesson> =>
  run(async database => {
    const user = await getCurrentUser()
    const result = await database
      .from('user_lessons')
      .upsert([{ lesson_id: id, user_id: user.id }])
      .select('id')

    const [record] = expectList(result)

    return serialize(record)
  })

export const submitAnswers = async (answers: { id: number }[]): Promise<UserAnswer[]> =>
  run(async database => {
    const user = await getCurrentUser()
    const result = await database
      .from('user_answers')
      .insert(answers.map(({ id }) => ({ option_id: id, user_id: user.id })))
      .select('id')

    return serialize(expectList(result))
  })

export const submitEvaluations = async (evaluations: { id: number; value: number }[]): Promise<UserEvaluation[]> =>
  run(async database => {
    const user = await getCurrentUser()
    const result = await database
      .from('user_evaluations')
      .insert(evaluations.map(({ id, value }) => ({ evaluation_id: id, user_id: user.id, value })))
      .select('id, value')

    return serialize(expectList(result))
  })

export const submitAssessment = async (id: number, value: number): Promise<UserAssessment> =>
  run(async database => {
    const user = await getCurrentUser()
    const result = await database
      .from('user_assessments')
      .insert({
        assessment_id: id,
        user_id: user.id,
        value,
      })
      .select('id, value')
      .single()

    return serialize(expectSingle(result))
  })

export const reorderCourses = async (courses: Course[]): Promise<void> =>
  run(async database => {
    const updates = courses.map(({ id, slug }, i) => ({ id, slug, sort_order: i + 1 }))
    const { error } = await database.from('courses').upsert(updates)
    if (error) throw error
  })

export const updateCourseIcon = async (id: number, icon: string | null): Promise<Course> =>
  run(async database => {
    const result = await database.from('courses').update({ icon }).eq('id', id).select(courseQuery).single()
    return parseCourse(expectSingle(result))
  })
