import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { assessments, evaluations, questionOptions } from './assessments'
import { courses, lessons } from './courses'
import { users } from './users'

export const userCourses = pgTable(
  'user_courses',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text()
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
  },
  table => [index('user_courses_user_id_idx').on(table.userId), index('user_courses_course_id_idx').on(table.courseId)]
)

export const userLessons = pgTable(
  'user_lessons',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text()
      .notNull()
      .references(() => users.id),
    lessonId: integer().references(() => lessons.id),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [index('user_lessons_user_id_idx').on(table.userId), index('user_lessons_lesson_id_idx').on(table.lessonId)]
)

export const userAnswers = pgTable(
  'user_answers',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text()
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
  },
  table => [index('user_answers_user_id_idx').on(table.userId), index('user_answers_option_id_idx').on(table.optionId)]
)

export const userAssessments = pgTable(
  'user_assessments',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text()
      .notNull()
      .references(() => users.id),
    assessmentId: integer().references(() => assessments.id),
    value: integer().notNull(),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [
    index('user_assessments_user_id_idx').on(table.userId),
    index('user_assessments_assessment_id_idx').on(table.assessmentId),
  ]
)

export const userEvaluations = pgTable(
  'user_evaluations',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: text()
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
  },
  table => [
    index('user_evaluations_user_id_idx').on(table.userId),
    index('user_evaluations_evaluation_id_idx').on(table.evaluationId),
  ]
)
