import { pgEnum } from 'drizzle-orm/pg-core'

export const certificateStatusEnum = pgEnum('certificate_status', [
  'draft',
  'submitted',
  'in_review',
  'changes_requested',
  'approved',
  'rejected',
  'withdrawn',
  'revoked',
])
export const certificateReviewDecisionEnum = pgEnum('certificate_review_decision', [
  'approved',
  'changes_requested',
  'rejected',
])
export const courseTypeEnum = pgEnum('course_type', ['intro', 'skill', 'learner'])
export const organizationRequestStatusEnum = pgEnum('organization_request_status', ['pending', 'accepted', 'rejected'])
export const membershipRoleEnum = pgEnum('role', ['admin', 'learner', 'tutor', 'representative', 'volunteer'])
export const skillCompassKindEnum = pgEnum('skill_compass_kind', ['strength', 'goal'])
export const legalVersionStatusEnum = pgEnum('legal_version_status', ['draft', 'published', 'superseded'])
export const legalTranslationStatusEnum = pgEnum('legal_translation_status', ['draft', 'machine', 'reviewed'])
