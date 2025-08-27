import { type User } from '@supabase/supabase-js'

import { handleize } from '@repo/utils/handleize'
import { pick } from '@repo/utils/pick'
import { pickRandom } from '@repo/utils/random'

import { type Tables } from 'supabase/types'

import { client } from './config/client'
import { course } from './config/data'
import { pickLanguages, randomLanguages, verifyResponse } from './config/utils'

const CREATOR_ROLES = ['admin', 'editor']

export const seedCourses = async ({ users }: { users?: User[] }) => {
  const courses: Tables<'courses'>[] = []

  const groups = await client.from('skill_groups').insert(pick(course.groups, 'name')).select()
  verifyResponse(groups, 'skill_groups')

  for (const skillGroup of course.groups) {
    // @ts-expect-error coherce json type
    const group = groups.data!.find(({ name }) => name.en === skillGroup.name.en)!

    for (const skillCourse of skillGroup.courses) {
      const slug = handleize(skillCourse.title.en)
      const creator = users
        ? pickRandom(users.filter(user => CREATOR_ROLES.includes(user.email!.split('@')[0])))
        : undefined
      const languages = randomLanguages()

      const title = pickLanguages(skillCourse.title, languages)
      const description = pickLanguages(skillCourse.description, languages)

      const newCourse = await client
        .from('courses')
        .insert({
          type: 'skill',
          slug,
          title,
          description,
          icon: skillCourse.icon,
          languages,
          sort_order: courses.length + 1,
          skill_group_id: group.id,
          creator_id: creator?.id,
        })
        .select()
      verifyResponse(newCourse, 'courses')

      courses.push(...newCourse.data!)
    }
  }

  return courses
}
