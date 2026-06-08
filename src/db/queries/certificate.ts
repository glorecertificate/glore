import { type InferSelectModel } from 'drizzle-orm'

import {
  type certificateSkills,
  type certificates,
  type courses,
  type organizationProfiles,
  type organizations,
  type users,
} from '@/db/schema'
import { type EnumType } from '@/db/types'

type CertificateRow = InferSelectModel<typeof certificates>
type OrganizationRow = Pick<InferSelectModel<typeof organizations>, 'id' | 'name' | 'city'> & {
  profile: Pick<InferSelectModel<typeof organizationProfiles>, 'avatarUrl'> | null
}
type CourseRow = Pick<InferSelectModel<typeof courses>, 'id' | 'slug' | 'title'>
type CertificateSkillRow = Omit<InferSelectModel<typeof certificateSkills>, 'courseId'> & { course: CourseRow }
type CertificateUserRow = Pick<InferSelectModel<typeof users>, 'id' | 'firstName' | 'lastName' | 'email'>

export type CertificateStatus = EnumType<'certificate_status'>

interface CertificateWithRelations extends CertificateRow {
  organization: OrganizationRow
  skills: CertificateSkillRow[]
  user?: CertificateUserRow | null
  reviewer?: CertificateUserRow | null
}

export type Certificate = ReturnType<typeof parseCertificate>

export const parseCertificate = (cert: CertificateWithRelations) => ({
  ...cert,
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
  isPending: cert.status === 'submitted' || cert.status === 'in_review',
})
