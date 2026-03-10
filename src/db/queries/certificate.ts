import { type InferSelectModel } from 'drizzle-orm'

import { type certificates, type organizations, type users } from '@/db/schema'

type CertificateRow = InferSelectModel<typeof certificates>
type OrganizationRow = InferSelectModel<typeof organizations>
type ReviewerRow = InferSelectModel<typeof users>

export interface Certificate extends CertificateRow {
  organization: OrganizationRow
  reviewer: ReviewerRow | null
}
