import { integer, jsonb, pgTable, uniqueIndex } from 'drizzle-orm/pg-core'

import { assessments } from './assessments'
import { skillLevelEnum } from './enums'
import { type IntlJsonb, timestamps } from './helpers'

export const skillLevelDescriptions = pgTable(
  'skill_level_descriptions',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    assessmentId: integer()
      .notNull()
      .references(() => assessments.id, { onDelete: 'cascade' }),
    level: skillLevelEnum().notNull(),
    description: jsonb().$type<IntlJsonb>().notNull(),
    ...timestamps,
  },
  table => [uniqueIndex('skill_level_descriptions_assessment_level_key').on(table.assessmentId, table.level)]
)
