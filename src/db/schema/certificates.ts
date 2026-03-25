import { boolean, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { courses } from './courses'
import { certificateStatusEnum } from './enums'
import { organizations } from './organizations'
import { users } from './users'

export const certificates = pgTable(
  'certificates',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    handle: text().notNull(),
    userId: text()
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
    reviewerId: text().references(() => users.id),
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
  },
  table => [
    index('certificates_user_id_idx').on(table.userId),
    index('certificates_organization_id_idx').on(table.organizationId),
    index('certificates_reviewer_id_idx').on(table.reviewerId),
    index('certificates_status_idx').on(table.status),
  ]
)

export const certificateSkills = pgTable(
  'certificate_skills',
  {
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
  },
  table => [
    index('certificate_skills_certificate_id_idx').on(table.certificateId),
    index('certificate_skills_course_id_idx').on(table.courseId),
  ]
)
