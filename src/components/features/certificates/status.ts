import { type StatusMeta } from '@/components/ui/status-badge'
import { type CertificateStatus } from '@/db/queries/certificate'

export const CERTIFICATE_STATUS = {
  approved: { icon: 'circle-check', labelKey: 'statusApproved', tone: 'success' },
  changes_requested: { icon: 'circle-alert', labelKey: 'statusChangesRequested', tone: 'warning' },
  draft: { icon: 'file-pen-line', labelKey: 'statusDraft', tone: 'neutral' },
  in_review: { icon: 'clock', labelKey: 'statusInReview', tone: 'info' },
  rejected: { icon: 'circle-x', labelKey: 'statusRejected', tone: 'danger' },
  revoked: { icon: 'ban', labelKey: 'statusRevoked', tone: 'danger' },
  submitted: { icon: 'send', labelKey: 'statusSubmitted', tone: 'info' },
  withdrawn: { icon: 'undo-2', labelKey: 'statusWithdrawn', tone: 'neutral' },
} as const satisfies Record<CertificateStatus, StatusMeta>

export const certificateStatusLabelKey = (status: CertificateStatus) => CERTIFICATE_STATUS[status].labelKey
