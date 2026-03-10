import { boolean, integer, jsonb, pgTable, timestamp } from 'drizzle-orm/pg-core'

import { lessons } from './courses'
import { type IntlJsonb, type IntlJsonbNullable } from './helpers'

export const questions = pgTable('questions', {
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
})

export const questionOptions = pgTable('question_options', {
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
})

export const evaluations = pgTable('evaluations', {
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
})

export const assessments = pgTable('assessments', {
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
})
