import { type InferSelectModel } from 'drizzle-orm'

import { type skillLevelDescriptions } from '@/db/schema'
import { type EnumType } from '@/db/types'
import { type IntlRecord } from '@/lib/i18n'

export type SkillLevel = EnumType<'skill_level'>

type SkillLevelDescription = IntlRecord & { id: number }

type SkillLevelDescriptions = Partial<Record<SkillLevel, SkillLevelDescription>>

export type SkillLevelDescriptionsByCourse = Record<number, SkillLevelDescriptions>

type SkillLevelDescriptionRow = Pick<
  InferSelectModel<typeof skillLevelDescriptions>,
  'description' | 'id' | 'level'
> & {
  courseId: number
}

export const SKILL_LEVELS = ['intermediate', 'good', 'advanced'] as const satisfies SkillLevel[]

export const SKILL_LEVEL_DESCRIPTION_MAX_LENGTH = 200

export const parseSkillLevelDescriptions = (rows: SkillLevelDescriptionRow[]): SkillLevelDescriptionsByCourse =>
  rows.reduce<SkillLevelDescriptionsByCourse>(
    (byCourse, row) => ({
      ...byCourse,
      [row.courseId]: { ...byCourse[row.courseId], [row.level]: { ...row.description, id: row.id } },
    }),
    {}
  )
