import { type StatusMeta } from '@/components/ui/status-badge'
import { type CertificateStatus } from '@/db/queries/certificate'

export const CERTIFICATE_STATUS = {
  approved: { icon: 'circle-check', labelKey: 'statusApproved', tone: 'approved' },
  changes_requested: { icon: 'circle-alert', labelKey: 'statusChangesRequested', tone: 'changes' },
  draft: { icon: 'file-pen-line', labelKey: 'statusDraft', tone: 'draft' },
  in_review: { icon: 'clock', labelKey: 'statusInReview', tone: 'review' },
  rejected: { icon: 'circle-x', labelKey: 'statusRejected', tone: 'rejected' },
  revoked: { icon: 'ban', labelKey: 'statusRevoked', tone: 'revoked' },
  submitted: { icon: 'send', labelKey: 'statusSubmitted', tone: 'submitted' },
  withdrawn: { icon: 'undo-2', labelKey: 'statusWithdrawn', tone: 'withdrawn' },
} as const satisfies Record<CertificateStatus, StatusMeta>

export const certificateStatusLabelKey = (status: CertificateStatus) => CERTIFICATE_STATUS[status].labelKey
