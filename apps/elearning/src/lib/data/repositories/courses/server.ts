import { cache } from 'react'

import { serialize } from '@glore/utils/serialize'

import { type Enums, type Tables } from '../../../../../supabase/types'
import { getDatabase } from '../../supabase/server'
import { getCurrentUser } from '../users/server'
import { type UserCourse } from '../users/types'
import { createRepositoryRunner, expectList, expectSingle } from '../utils'
import { courseQuery } from './queries'
import { type SkillGroup } from './types'
import { parseCourse } from './utils'

const run = createRepositoryRunner(getDatabase)

export const enrollUser = async (courseId: number, locale: Enums<'locale'>): Promise<UserCourse> =>
  run(async database => {
    const user = await getCurrentUser()
    const result = await database
      .from('user_courses')
      .insert({ course_id: courseId, locale, user_id: user.id })
      .select()

    const [record] = expectList<Tables<'user_courses'>>(result)
    return serialize(record)
  })

export const listCourses = cache(async () =>
  run(async database => {
    const result = await database.from('courses').select(courseQuery)
    return expectList(result).map(parseCourse)
  })
)

export const findCourse = cache(async (slug: string) =>
  run(async database => {
    const result = await database.from('courses').select(courseQuery).eq('slug', slug).single()
    return parseCourse(expectSingle(result))
  })
)

export const getSkillGroups = async (): Promise<SkillGroup[]> =>
  run(async database => {
    const result = await database.from('skill_groups').select('id, name').order('name')
    return serialize(expectList(result))
  })
