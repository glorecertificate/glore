import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

import { courses } from './courses'
import { certificateReviewDecisionEnum, certificateStatusEnum } from './enums'
import { type IntlJsonb } from './helpers'
import { organizations } from './organizations'
import { users } from './users'

export interface CertificateSnapshot {
  holder: {
    birthPlace: string | null
    birthday: string | null
    firstName: string
    lastName: string | null
    nationality: string | null
  }
  organization: {
    id: number
    legalRepresentative: string | null
    logoUrl: string | null
    name: string
    signatureUrl: string | null
  }
  activity: {
    duration: number
    endDate: string
    location: string
    startDate: string
    tasks: string[]
  }
  skills: {
    courseId: number
    icon: string | null
    level: number
    name: IntlJsonb
    statement: string | null
  }[]
  issuedAt: string
  language: string
}

type CertificateSection = 'experience' | 'personal' | 'skills' | 'tasks'

const levelCheck = (name: string, column: string) =>
  check(name, sql.raw(`${column} is null or ${column} between 1 and 5`))

export const certificates = pgTable(
  'certificates',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    handle: text().notNull(),
    code: text().unique(),
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
    tasks: text()
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    reviewerId: text().references(() => users.id),
    reviewerComment: text(),
    status: certificateStatusEnum().notNull().default('draft'),
    isDefault: boolean().notNull().default(false),
    documentUrl: text(),
    snapshot: jsonb().$type<CertificateSnapshot>(),
    submittedAt: timestamp({ mode: 'string' }),
    reviewedAt: timestamp({ mode: 'string' }),
    rejectedReason: text(),
    revokedAt: timestamp({ mode: 'string' }),
    revokedById: text().references(() => users.id, { onDelete: 'set null' }),
    revokedReason: text(),
    withdrawnAt: timestamp({ mode: 'string' }),
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
    uniqueIndex('certificates_handle_key').on(table.handle),
  ]
)

export const certificateSkills = pgTable(
  'certificate_skills',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    certificateId: integer()
      .notNull()
      .references(() => certificates.id, { onDelete: 'cascade' }),
    courseId: integer()
      .notNull()
      .references(() => courses.id),
    selfLevel: smallint(),
    level: smallint(),
    evidence: text(),
    statement: text(),
    sortOrder: integer().default(0).notNull(),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [
    index('certificate_skills_certificate_id_idx').on(table.certificateId),
    index('certificate_skills_course_id_idx').on(table.courseId),
    uniqueIndex('certificate_skills_certificate_id_course_id_key').on(table.certificateId, table.courseId),
    levelCheck('certificate_skills_self_level_check', 'self_level'),
    levelCheck('certificate_skills_level_check', 'level'),
  ]
)

export const certificateReviews = pgTable(
  'certificate_reviews',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    certificateId: integer()
      .notNull()
      .references(() => certificates.id, { onDelete: 'cascade' }),
    reviewerId: text().references(() => users.id, { onDelete: 'set null' }),
    decision: certificateReviewDecisionEnum().notNull(),
    comment: text(),
    sectionComments: jsonb().$type<Partial<Record<CertificateSection, string>>>().default({}).notNull(),
    scoreEngagement: smallint(),
    scoreEvidence: smallint(),
    scoreReflection: smallint(),
    scoreGrowth: smallint(),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  },
  table => [
    index('certificate_reviews_certificate_id_idx').on(table.certificateId, table.createdAt),
    index('certificate_reviews_reviewer_id_idx').on(table.reviewerId),
    levelCheck('certificate_reviews_score_engagement_check', 'score_engagement'),
    levelCheck('certificate_reviews_score_evidence_check', 'score_evidence'),
    levelCheck('certificate_reviews_score_reflection_check', 'score_reflection'),
    levelCheck('certificate_reviews_score_growth_check', 'score_growth'),
  ]
)

export const organizationRatings = pgTable(
  'organization_ratings',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    certificateId: integer()
      .notNull()
      .unique()
      .references(() => certificates.id, { onDelete: 'cascade' }),
    organizationId: integer()
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    experience: smallint(),
    support: smallint(),
    certificationSupport: smallint(),
    wouldRecommend: boolean(),
    comment: varchar({ length: 400 }),
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: 'string' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  table => [
    index('organization_ratings_organization_id_idx').on(table.organizationId),
    levelCheck('organization_ratings_experience_check', 'experience'),
    levelCheck('organization_ratings_support_check', 'support'),
    levelCheck('organization_ratings_certification_support_check', 'certification_support'),
  ]
)
