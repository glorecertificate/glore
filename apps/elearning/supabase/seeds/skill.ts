import { type SeedClient } from '@snaplet/seed'
import { type User } from '@supabase/supabase-js'

import { handleize, pickRandom } from '@repo/utils'

import { seeds } from 'config/development.json'
import { type Enums } from 'supabase/types'

export const seedSkills = async (seed: SeedClient, skillAreas = seeds.skill_areas, users: Array<User | null>) =>
  await seed.skill_areas(
    skillAreas.map(({ skills, ...area }, i) => ({
      ...area,
      skills: skills.map(({ course, ...skill }, j) => ({
        ...skill,
        courses: [
          {
            ...course,
            slug: handleize(skill.name.en),
            title: skill.name,
            description: skill.description,
            type: 'assessment',
            lessons: course.lessons.map(({ type, ...lesson }, k) => ({
              ...lesson,
              type: type as Enums<'lesson_type'>,
              sort_order: k + 1,
              deleted_at: null,
            })),
            creator_id: pickRandom(users)!.id ?? null,
            sort_order: i * skillAreas[0].skills.length + j + 1,
            deleted_at: null,
          },
        ],
        deleted_at: null,
      })),
      deleted_at: null,
    })),
  )
