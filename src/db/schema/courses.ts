import { index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { courseTypeEnum } from './enums'
import { type IntlJsonb, type IntlJsonbNullable } from './helpers'
import { skillGroups } from './skill-groups'
import { users } from './users'

export const courses = pgTable(
  'courses',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    type: courseTypeEnum(),
    slug: text().notNull().unique(),
    title: jsonb().$type<IntlJsonbNullable>(),
    description: jsonb().$type<IntlJsonbNullable>(),
    icon: text(),
    languages: text().array(),
    skillGroupId: integer().references(() => skillGroups.id),
    creatorId: text()
      .notNull()
      .references(() => users.id),
    sortOrder: integer(),
    archivedAt: timestamp({ mode: 'string', withTimezone: true }),
    archivedById: text().references(() => users.id),
    createdAt: timestamp({ mode: 'string', withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string', withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [
    index('courses_skill_group_id_idx').on(table.skillGroupId),
    index('courses_creator_id_idx').on(table.creatorId),
  ]
)

export const lessons = pgTable(
  'lessons',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    courseId: integer()
      .notNull()
      .references(() => courses.id),
    title: jsonb().$type<IntlJsonb>().notNull(),
    content: jsonb().$type<IntlJsonbNullable>(),
    sortOrder: integer().notNull(),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [index('lessons_course_id_idx').on(table.courseId)]
)

export const contributions = pgTable(
  'contributions',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    lessonId: integer()
      .notNull()
      .references(() => lessons.id),
    userId: text()
      .notNull()
      .references(() => users.id),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [
    index('contributions_lesson_id_idx').on(table.lessonId),
    index('contributions_user_id_idx').on(table.userId),
  ]
)
