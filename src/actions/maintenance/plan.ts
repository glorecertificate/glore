import { timestampMillis } from '@/db/queries/organization'

const DAY = 24 * 60 * 60 * 1000

export interface OpenReview {
  holderId: string
  id: number
  organizationId: number
  reviewerId: string | null
  submittedAt: string
}

export interface FiredReviewEvent {
  certificateId: number
  createdAt: string
  days: number
  kind: 'escalated' | 'reminder'
}

export interface ReviewAction {
  certificate: OpenReview
  days: number
  kind: 'escalated' | 'reminder'
}

const daysSince = (value: string, now: number) => Math.floor((now - timestampMillis(value)) / DAY)

export const planReviewActions = ({
  certificates,
  fired,
  now,
  thresholds,
}: {
  certificates: OpenReview[]
  fired: FiredReviewEvent[]
  now: number
  thresholds: number[]
}) => {
  const last = Math.max(...thresholds)

  return certificates.flatMap(certificate => {
    const due = thresholds.filter(days => days <= daysSince(certificate.submittedAt, now))
    if (due.length === 0) return []
    const days = Math.max(...due)
    const submitted = timestampMillis(certificate.submittedAt)
    const has = (kind: ReviewAction['kind']) =>
      fired.some(
        event =>
          event.certificateId === certificate.id &&
          event.kind === kind &&
          event.days === days &&
          timestampMillis(event.createdAt) >= submitted
      )

    const actions: ReviewAction[] = []
    if (certificate.reviewerId && !has('reminder')) actions.push({ certificate, days, kind: 'reminder' })
    if (days === last && !has('escalated')) actions.push({ certificate, days, kind: 'escalated' })
    return actions
  })
}

export interface OpenInvitation {
  createdAt: string
  expiresAt: string
  id: number
  lastSentAt: string | null
}

export interface FiredInvitationEvent {
  createdAt: string
  invitationId: number
}

export const planInvitationReminders = <T extends OpenInvitation>({
  fired,
  invitations,
  now,
  reminderDay,
}: {
  fired: FiredInvitationEvent[]
  invitations: T[]
  now: number
  reminderDay: number
}) =>
  invitations.filter(invitation => {
    if (timestampMillis(invitation.expiresAt) <= now) return false
    const sentAt = invitation.lastSentAt ?? invitation.createdAt
    if (daysSince(sentAt, now) < reminderDay) return false
    const sent = timestampMillis(sentAt)
    return !fired.some(event => event.invitationId === invitation.id && timestampMillis(event.createdAt) >= sent)
  })

export const selectOrphanPdfKeys = (
  objects: { key: string; lastModified: Date }[],
  certificates: { documentUrl: string | null; handle: string }[],
  cutoff: Date
) => {
  const referenced = new Set<string>()
  for (const { documentUrl, handle } of certificates) {
    referenced.add(`certificates/${handle}.pdf`)
    const path = documentUrl ? URL.parse(documentUrl)?.pathname.replace(/^\//u, '') : null
    if (path) referenced.add(path)
  }
  return objects.flatMap(({ key, lastModified }) => (lastModified < cutoff && !referenced.has(key) ? [key] : []))
}
