import { cache } from 'react'

import { serialize } from '@glore/utils/serialize'

import { type Enums, type Tables } from '../../supabase'
import { getDatabase } from '../../supabase/server'
import { type UserCourse } from '../users'
import { getCurrentUser } from '../users/server'
import { createRepositoryRunner, expectList, expectSingle } from '../utils'
import { courseQuery } from './queries'
import { type Course } from './types'
import { type CourseRecord, parseCourse } from './utils'

const run = createRepositoryRunner(getDatabase)

export const enrollUser = async (courseId: number, locale: Enums<'locale'>): Promise<UserCourse> =>
  run(async database => {
    const user = await getCurrentUser()
    const result = await database
      .from('user_courses')
      .insert({ course_id: courseId, locale, user_id: user.id })
      .select()

    const [record] = expectList<Tables<'user_courses'>>(result)

    return serialize(record) as UserCourse
  })

export const listCourses = cache(
  async (): Promise<Course[]> =>
    run(async database => {
      const result = await database.from('courses').select(courseQuery)

      return expectList<CourseRecord>(result).map(parseCourse)
    })
)

export const findCourse = cache(
  async (slug: string): Promise<Course> =>
    run(async database => {
      const result = await database.from('courses').select(courseQuery).eq('slug', slug).single()

      return parseCourse(expectSingle<CourseRecord>(result))
    })
)
