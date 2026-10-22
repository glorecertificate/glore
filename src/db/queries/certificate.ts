import { type InferSelectModel } from 'drizzle-orm'

import {
  type certificateSkills,
  type certificates,
  type courses,
  type organizationProfiles,
  type organizationRatings,
  type organizations,
  type users,
} from '@/db/schema'
import { type EnumType } from '@/db/types'

type CertificateRow = InferSelectModel<typeof certificates>
type OrganizationRow = Pick<InferSelectModel<typeof organizations>, 'id' | 'name' | 'city'> & {
  profile: Pick<InferSelectModel<typeof organizationProfiles>, 'avatarUrl'> | null
}
type RatingRow = InferSelectModel<typeof organizationRatings>
type CourseRow = Pick<InferSelectModel<typeof courses>, 'id' | 'slug' | 'title'>
type CertificateSkillRow = Omit<InferSelectModel<typeof certificateSkills>, 'courseId'> & { course: CourseRow }
type CertificateUserRow = Pick<InferSelectModel<typeof users>, 'id' | 'firstName' | 'lastName'> &
  Partial<Pick<InferSelectModel<typeof users>, 'email'>>

export type CertificateStatus = EnumType<'certificate_status'>

export const OPEN_CERTIFICATE_STATUSES = [
  'submitted',
  'in_review',
  'changes_requested',
] as const satisfies CertificateStatus[]

interface CertificateWithRelations extends CertificateRow {
  organization: OrganizationRow
  rating?: RatingRow | null
  skills: CertificateSkillRow[]
  user?: CertificateUserRow | null
  reviewer?: CertificateUserRow | null
}

export type Certificate = ReturnType<typeof parseCertificate>

export const parseCertificate = (cert: CertificateWithRelations) => ({
  ...cert,
  rating: cert.rating ?? null,
  organization: ((organization: OrganizationRow) => {
    const { profile, ...rest } = organization
    return {
      ...rest,
      avatarUrl: profile?.avatarUrl ?? null,
    }
  })(cert.organization),
  isDraft: cert.status === 'draft',
  isSubmitted: cert.status === 'submitted',
  isInReview: cert.status === 'in_review',
  isChangesRequested: cert.status === 'changes_requested',
  isApproved: cert.status === 'approved',
  isHolderDeleted: cert.holderDeletedAt !== null,
  isRejected: cert.status === 'rejected',
  isWithdrawn: cert.status === 'withdrawn',
  isRevoked: cert.status === 'revoked',
  isPending: cert.status === 'submitted' || cert.status === 'in_review',
  isOpen: (OPEN_CERTIFICATE_STATUSES as readonly CertificateStatus[]).includes(cert.status),
})
