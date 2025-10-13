import { type IntlRecord } from '@glore/i18n'
import { pick } from '@glore/utils/pick'
import { randomItem, randomRange } from '@glore/utils/random'
import { handleize } from '@glore/utils/string'

import { type AuthUser, type Enums, type Tables } from '@/lib/db'
import { seedClient, seeder, verifyResponse } from './shared'

const CREATOR_ROLES = ['admin', 'editor']

const pickLanguages = (record: Record<Enums<'locale'>, string>, locales: Enums<'locale'>[]) => {
  const obj = Object.entries(record).reduce(
    (obj, [locale, value]) => (locales.includes(locale as Enums<'locale'>) ? { ...obj, [locale]: value } : obj),
    {}
  )
  return Object.keys(obj).length ? (obj as Record<Enums<'locale'>, string>) : record
}

const randomLanguages = () => randomRange(seeder.locales, 0, 3)

export const seedCourses = async ({ users }: { users?: AuthUser[] }) => {
  const courses: Tables<'courses'>[] = []

  const groups = await seedClient.from('skill_groups').insert(pick(seeder.course.groups, 'name')).select()
  verifyResponse(groups, 'skill_groups')

  for (const skillGroup of seeder.course.groups) {
    const group = groups.data?.find(({ name }) => (name as IntlRecord).en === skillGroup.name.en)!

    for (const skillCourse of skillGroup.courses) {
      const slug = handleize(skillCourse.title.en)
      const creator = users
        ? randomItem(users.filter(user => CREATOR_ROLES.includes(user.email?.split('@')[0]!)))
        : undefined
      const languages = randomLanguages()

      const title = pickLanguages(skillCourse.title, seeder.languages)
      const description = pickLanguages(skillCourse.description, seeder.languages)

      const newCourse = await seedClient
        .from('courses')
        .insert({
          creator_id: creator?.id,
          description,
          icon: skillCourse.icon,
          languages,
          skill_group_id: group.id,
          slug,
          sort_order: courses.length + 1,
          title,
          type: 'skill',
        })
        .select()
      verifyResponse(newCourse, 'courses')

      courses.push(...newCourse.data!)
    }
  }

  return courses
}
