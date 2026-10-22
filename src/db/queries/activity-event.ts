import { type EnumType } from '@/db/types'

type Role = EnumType<'role'>

interface CertificateRef {
  certificateId: number
  holderId: string
}

interface EventPayloads {
  'certificate.submitted': CertificateRef & { tutorId: string | null }
  'certificate.assigned': CertificateRef & { previousTutorId: string | null; tutorId: string }
  'certificate.claimed': CertificateRef & { tutorId: string }
  'certificate.changes_requested': CertificateRef & { comment: string | null; tutorId: string }
  'certificate.resubmitted': CertificateRef & { tutorId: string | null }
  'certificate.approved': CertificateRef & { documentUrl: string | null; tutorId: string }
  'certificate.rejected': CertificateRef & { reason: string }
  'certificate.revoked': CertificateRef & { reason: string }
  'certificate.withdrawn': CertificateRef & { tutorId: string | null }
  'certificate.review_reminder': CertificateRef & { days: number; tutorId: string }
  'certificate.review_escalated': CertificateRef & { days: number; tutorId: string | null }
  'learning.eligible': { userId: string }
  'course.completed': { courseId: number; courseSlug: string; userId: string }
  'organization.application_received': {
    applicantEmail: string
    applicantName: string
    city: string
    country: string | null
    locale: string | null
    message: string | null
    organizationName: string
  }
  'organization.application_decided': {
    applicantEmail: string
    applicantName: string
    approved: boolean
    comment: string | null
    invitationUrl: string | null
    locale: string | null
    organizationName: string
  }
  'invitation.sent': {
    email: string
    invitationId: number
    inviterId: string | null
    locale: string | null
    organizationName: string
    role: Role
    url: string
    userId: string | null
  }
  'invitation.accepted': { invitationId: number; inviterId: string | null; userId: string }
  'invitation.expiring': {
    email: string
    invitationId: number
    locale: string | null
    organizationName: string
    url: string
    userId: string | null
  }
  'join_request.created': { email: string; joinRequestId: number; name: string; organizationName: string }
  'join_request.decided': {
    accepted: boolean
    comment: string | null
    email: string
    joinRequestId: number
    locale: string | null
    name: string
    organizationName: string
    url: string | null
    userId: string | null
  }
  'member.role_changed': { previousRole: Role; role: Role; userId: string }
  'member.removed': { userId: string }
  'member.left': { userId: string }
  'organization.ownership_transferred': { newOwnerId: string; previousOwnerId: string }
  'team.invited': { email: string; name: string; role: 'admin' | 'editor'; url: string; userId: string }
  'team.role_changed': { role: 'admin' | 'editor' | null; userId: string }
  'account.welcome': { userId: string }
  'account.suspended': { expiresAt: string | null; reason: string | null; userId: string }
  'account.deleted': { email: string; firstName: string; locale: string | null; userId: string }
}

export type EventType = keyof EventPayloads

type SubjectType = 'account' | 'certificate' | 'course' | 'invitation' | 'join_request' | 'organization' | 'user'

export interface AppEvent<K extends EventType = EventType> {
  type: K
  actorId: string | null
  organizationId: number | null
  data: EventPayloads[K]
}

const PRIVATE_KEYS = new Set(['applicantEmail', 'documentUrl', 'email', 'firstName', 'invitationUrl', 'url'])

export const eventSubject = (event: AppEvent): { type: SubjectType; id: string } => {
  if ('certificateId' in event.data) return { type: 'certificate', id: String(event.data.certificateId) }
  if ('invitationId' in event.data) return { type: 'invitation', id: String(event.data.invitationId) }
  if ('joinRequestId' in event.data) return { type: 'join_request', id: String(event.data.joinRequestId) }
  if ('courseId' in event.data) return { type: 'course', id: String(event.data.courseId) }
  if (event.type === 'organization.application_received' || event.type === 'organization.application_decided') {
    return { type: 'organization', id: String(event.organizationId ?? '') }
  }
  if (event.type === 'organization.ownership_transferred') {
    return { type: 'organization', id: String(event.organizationId ?? '') }
  }
  if (event.type.startsWith('account.')) return { type: 'account', id: 'userId' in event.data ? event.data.userId : '' }
  return { type: 'user', id: 'userId' in event.data ? String(event.data.userId) : '' }
}

export const eventMetadata = (event: AppEvent) =>
  Object.fromEntries(Object.entries(event.data).filter(([key]) => !PRIVATE_KEYS.has(key)))
