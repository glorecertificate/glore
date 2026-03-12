import { pgEnum } from 'drizzle-orm/pg-core'

export const certificateStatusEnum = pgEnum('certificate_status', [
  'draft',
  'submitted',
  'in_review',
  'changes_requested',
  'approved',
])
export const courseTypeEnum = pgEnum('course_type', ['intro', 'skill', 'learner'])
export const organizationRequestStatusEnum = pgEnum('organization_request_status', ['pending', 'accepted', 'rejected'])
export const membershipRoleEnum = pgEnum('role', ['admin', 'learner', 'tutor', 'representative', 'volunteer'])
