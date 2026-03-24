import { boolean, index, integer, jsonb, pgTable, timestamp } from 'drizzle-orm/pg-core'

import { lessons } from './courses'
import { type IntlJsonb, type IntlJsonbNullable } from './helpers'

export const questions = pgTable(
  'questions',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    lessonId: integer()
      .notNull()
      .references(() => lessons.id),
    description: jsonb().$type<IntlJsonb>().notNull(),
    explanation: jsonb().$type<IntlJsonbNullable>(),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [index('questions_lesson_id_idx').on(table.lessonId)]
)

export const questionOptions = pgTable(
  'question_options',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    questionId: integer()
      .notNull()
      .references(() => questions.id),
    content: jsonb().$type<IntlJsonb>().notNull(),
    isCorrect: boolean().notNull(),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [index('question_options_question_id_idx').on(table.questionId)]
)

export const evaluations = pgTable(
  'evaluations',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    lessonId: integer()
      .notNull()
      .references(() => lessons.id),
    description: jsonb().$type<IntlJsonb>().notNull(),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [index('evaluations_lesson_id_idx').on(table.lessonId)]
)

export const assessments = pgTable(
  'assessments',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    lessonId: integer()
      .notNull()
      .references(() => lessons.id),
    description: jsonb().$type<IntlJsonbNullable>(),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [index('assessments_lesson_id_idx').on(table.lessonId)]
)
