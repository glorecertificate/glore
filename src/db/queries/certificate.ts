import { type InferSelectModel } from 'drizzle-orm'

import { type certificates, type certificateSkills, type courses, type organizations } from '@/db/schema'
import { type EnumType } from '@/db/types'

type CertificateRow = InferSelectModel<typeof certificates>
type OrganizationRow = Pick<
  InferSelectModel<typeof organizations>,
  'id' | 'handle' | 'name' | 'city' | 'country' | 'avatarUrl'
>
type CourseRow = Pick<InferSelectModel<typeof courses>, 'id' | 'slug' | 'title'>
type CertificateSkillRow = Omit<InferSelectModel<typeof certificateSkills>, 'courseId'> & { course: CourseRow }

export type CertificateStatus = EnumType<'certificate_status'>

export const CERTIFICATE_STATUSES = [
  'draft',
  'submitted',
  'in_review',
  'changes_requested',
  'approved',
] satisfies CertificateStatus[]

export interface CertificateWithRelations extends CertificateRow {
  organization: OrganizationRow
  skills: CertificateSkillRow[]
}

export type Certificate = ReturnType<typeof parseCertificate>

export const parseCertificate = (cert: CertificateWithRelations) => ({
  ...cert,
  isDraft: cert.status === 'draft',
  isSubmitted: cert.status === 'submitted',
  isInReview: cert.status === 'in_review',
  isChangesRequested: cert.status === 'changes_requested',
  isApproved: cert.status === 'approved',
  isPending: cert.status === 'submitted' || cert.status === 'in_review',
})
