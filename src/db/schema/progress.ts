import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { assessments, evaluations, questionOptions } from './assessments'
import { courses, lessons } from './courses'
import { users } from './users'

export const userCourses = pgTable('user_courses', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid()
    .notNull()
    .references(() => users.id),
  courseId: integer()
    .notNull()
    .references(() => courses.id),
  locale: text().notNull(),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})

export const userLessons = pgTable('user_lessons', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid()
    .notNull()
    .references(() => users.id),
  lessonId: integer().references(() => lessons.id),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})

export const userAnswers = pgTable('user_answers', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid()
    .notNull()
    .references(() => users.id),
  optionId: integer()
    .notNull()
    .references(() => questionOptions.id),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})

export const userAssessments = pgTable('user_assessments', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid()
    .notNull()
    .references(() => users.id),
  assessmentId: integer().references(() => assessments.id),
  value: integer().notNull(),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})

export const userEvaluations = pgTable('user_evaluations', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid()
    .notNull()
    .references(() => users.id),
  evaluationId: integer()
    .notNull()
    .references(() => evaluations.id),
  value: integer().notNull(),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})
