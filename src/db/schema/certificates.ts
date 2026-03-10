import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { courses } from './courses'
import { certificateStatusEnum } from './enums'
import { organizations } from './organizations'
import { users } from './users'

export const certificates = pgTable('certificates', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  handle: text().notNull(),
  userId: uuid()
    .notNull()
    .references(() => users.id),
  organizationId: integer()
    .notNull()
    .references(() => organizations.id),
  language: text().notNull(),
  activityStartDate: text().notNull(),
  activityEndDate: text().notNull(),
  activityDuration: integer().notNull(),
  activityLocation: text().notNull(),
  activityDescription: text().notNull(),
  organizationRating: integer().notNull(),
  reviewerId: uuid().references(() => users.id),
  reviewerComment: text(),
  status: certificateStatusEnum().notNull().default('draft'),
  isDefault: boolean().notNull().default(false),
  documentUrl: text(),
  issuedAt: timestamp({ mode: 'string' }),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})

export const certificateSkills = pgTable('certificate_skills', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  certificateId: integer()
    .notNull()
    .references(() => certificates.id),
  courseId: integer()
    .notNull()
    .references(() => courses.id),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date().toISOString()),
})
