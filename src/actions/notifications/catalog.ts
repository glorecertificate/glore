import 'server-only'

import { type MailCategory, type PlannedMail, type Recipient } from '@/actions/notifications/plan'
import { organizationMemberIds, platformAdminIds } from '@/actions/notifications/recipients'
import { type AppEvent, type EventType } from '@/db/queries/activity-event'
import { type EmailTemplate } from '@/lib/email'

interface EventDefinition<K extends EventType> {
  inApp?: (event: AppEvent<K>) => Promise<string[]> | string[]
  email?: {
    category: MailCategory
    to: (event: AppEvent<K>) => Promise<Recipient[]> | Recipient[]
    template?: (event: AppEvent<K>, mail: PlannedMail) => EmailTemplate
  }
  notifyActor?: boolean
  url?: (event: AppEvent<K>) => string | null
}

const MANAGER_ROLES = ['admin', 'representative'] as const

const users = (...ids: (string | null | undefined)[]) =>
  ids.filter((id): id is string => Boolean(id)).map(userId => ({ userId }))

interface CertificateEvent {
  data: { certificateId: number; holderId: string; tutorId?: string | null }
  organizationId: number | null
}

const tutorOrPool = async (event: CertificateEvent) => {
  if (event.data.tutorId) return [event.data.tutorId]
  return await organizationMemberIds(event.organizationId, ['tutor'], { exclude: event.data.holderId })
}

const managers = async (event: { organizationId: number | null }) =>
  await organizationMemberIds(event.organizationId, [...MANAGER_ROLES])

const certificateUrl = (event: CertificateEvent) => `/certificates/${event.data.certificateId}`

const reviewUrl = (event: CertificateEvent) => `/certificates/${event.data.certificateId}/review`

export const EVENT_DEFINITIONS: { [K in EventType]: EventDefinition<K> } = {
  'certificate.submitted': {
    inApp: tutorOrPool,
    email: {
      category: 'mandatory',
      to: async event => users(...(await tutorOrPool(event))),
      template: () => ({ name: 'certificate/assigned', props: {} }),
    },
    url: reviewUrl,
  },
  'certificate.assigned': {
    inApp: event => [event.data.tutorId, event.data.previousTutorId].filter((id): id is string => Boolean(id)),
    email: {
      category: 'mandatory',
      to: event => users(event.data.tutorId),
      template: () => ({ name: 'certificate/assigned', props: {} }),
    },
    url: reviewUrl,
  },
  'certificate.claimed': {
    inApp: event => [event.data.holderId],
    url: certificateUrl,
  },
  'certificate.unassigned': {
    inApp: async event => [event.data.previousTutorId, ...(await tutorOrPool(event))],
    url: certificateUrl,
  },
  'certificate.changes_requested': {
    inApp: event => [event.data.holderId],
    email: {
      category: 'mandatory',
      to: event => users(event.data.holderId),
      template: (event, mail) => ({
        name: 'certificate/review',
        props: {
          status: 'changes_requested',
          comment: event.data.comment ?? undefined,
          userName: mail.name ?? undefined,
        },
      }),
    },
    url: certificateUrl,
  },
  'certificate.resubmitted': {
    inApp: tutorOrPool,
    email: { category: 'mandatory', to: async event => users(...(await tutorOrPool(event))) },
    url: reviewUrl,
  },
  'certificate.approved': {
    inApp: async event => [event.data.holderId, ...(await managers(event))],
    email: {
      category: 'mandatory',
      to: event => users(event.data.holderId),
      template: (event, mail) => ({
        name: 'certificate/review',
        props: {
          status: 'approved',
          documentUrl: event.data.documentUrl ?? undefined,
          userName: mail.name ?? undefined,
        },
      }),
    },
    url: certificateUrl,
  },
  'certificate.rejected': {
    inApp: event => [event.data.holderId],
    email: { category: 'mandatory', to: event => users(event.data.holderId) },
    url: certificateUrl,
  },
  'certificate.revoked': {
    inApp: event => [event.data.holderId],
    email: { category: 'mandatory', to: event => users(event.data.holderId) },
    url: certificateUrl,
  },
  'certificate.withdrawn': {
    inApp: event => (event.data.tutorId ? [event.data.tutorId] : []),
    url: certificateUrl,
  },
  'certificate.review_reminder': {
    inApp: event => [event.data.tutorId],
    email: { category: 'reminders', to: event => users(event.data.tutorId) },
    url: reviewUrl,
  },
  'certificate.review_escalated': {
    inApp: managers,
    email: { category: 'reminders', to: async event => users(...(await managers(event))) },
    url: certificateUrl,
  },
  'learning.eligible': {
    inApp: event => [event.data.userId],
    email: { category: 'learning', to: event => users(event.data.userId) },
    notifyActor: true,
    url: () => '/certificates/new',
  },
  'course.completed': {
    inApp: event => [event.data.userId],
    notifyActor: true,
    url: event => `/courses/${event.data.courseSlug}`,
  },
  'organization.application_received': {
    inApp: platformAdminIds,
    email: {
      category: 'mandatory',
      to: async event => [
        { email: event.data.applicantEmail, locale: event.data.locale, name: event.data.applicantName },
        ...users(...(await platformAdminIds())),
      ],
      template: (event, mail) =>
        mail.userId
          ? {
              name: 'organization/registration-request',
              props: {
                city: event.data.city,
                country: event.data.country,
                message: event.data.message,
                organizationId: event.organizationId ?? 0,
                organizationName: event.data.organizationName,
                registrantEmail: event.data.applicantEmail,
                registrantName: event.data.applicantName,
                userName: mail.name ?? undefined,
              },
            }
          : {
              name: 'organization/join-request',
              props: {
                organizationName: event.data.organizationName,
                status: 'pending',
                userName: mail.name ?? undefined,
              },
            },
    },
    url: () => '/admin/organizations',
  },
  'organization.application_decided': {
    email: {
      category: 'mandatory',
      to: event => [{ email: event.data.applicantEmail, locale: event.data.locale, name: event.data.applicantName }],
      template: (event, mail) => ({
        name: 'organization/join-request',
        props: {
          comment: event.data.comment,
          organizationName: event.data.organizationName,
          status: event.data.approved ? 'accepted' : 'rejected',
          url: event.data.invitationUrl ?? undefined,
          userName: mail.name ?? undefined,
        },
      }),
    },
  },
  'invitation.sent': {
    inApp: event => (event.data.userId ? [event.data.userId] : []),
    email: {
      category: 'mandatory',
      to: event => [{ email: event.data.email, locale: event.data.locale, name: null }],
    },
    url: event => new URL(event.data.url).pathname,
  },
  'invitation.accepted': {
    inApp: event => (event.data.inviterId ? [event.data.inviterId] : []),
    url: () => '/organization?tab=members',
  },
  'invitation.expiring': {
    email: {
      category: 'reminders',
      to: event =>
        event.data.userId
          ? users(event.data.userId)
          : [{ email: event.data.email, locale: event.data.locale, name: null }],
    },
  },
  'join_request.created': {
    inApp: managers,
    email: { category: 'organization', to: async event => users(...(await managers(event))) },
    url: () => '/organization?tab=requests',
  },
  'join_request.decided': {
    inApp: event => (event.data.userId ? [event.data.userId] : []),
    email: {
      category: 'mandatory',
      to: event => [{ email: event.data.email, locale: event.data.locale, name: event.data.name }],
      template: (event, mail) => ({
        name: 'organization/join-request',
        props: {
          comment: event.data.comment,
          organizationName: event.data.organizationName,
          status: event.data.accepted ? 'accepted' : 'rejected',
          url: event.data.url ?? undefined,
          userName: mail.name ?? undefined,
        },
      }),
    },
    url: () => '/dashboard',
  },
  'member.role_changed': {
    inApp: event => [event.data.userId],
    email: { category: 'mandatory', to: event => users(event.data.userId) },
    url: () => '/organization',
  },
  'member.removed': {
    email: { category: 'mandatory', to: event => users(event.data.userId) },
  },
  'member.left': {
    inApp: managers,
    url: () => '/organization?tab=members',
  },
  'organization.ownership_transferred': {
    inApp: event => [event.data.previousOwnerId, event.data.newOwnerId],
    email: {
      category: 'mandatory',
      to: event => users(event.data.previousOwnerId, event.data.newOwnerId),
    },
    notifyActor: true,
    url: () => '/organization',
  },
  'team.invited': {
    inApp: event => [event.data.userId],
    email: {
      category: 'mandatory',
      to: event => users(event.data.userId),
      template: event => ({
        name: 'team/invite',
        props: { inviteeName: event.data.name, role: event.data.role, url: event.data.url },
      }),
    },
    url: () => '/dashboard',
  },
  'team.role_changed': {
    inApp: event => [event.data.userId],
    email: { category: 'mandatory', to: event => users(event.data.userId) },
    url: () => '/dashboard',
  },
  'account.welcome': {
    email: { category: 'mandatory', to: event => users(event.data.userId) },
    notifyActor: true,
  },
  'account.suspended': {
    email: { category: 'mandatory', to: event => users(event.data.userId) },
  },
  'account.deleted': {
    email: {
      category: 'mandatory',
      to: event => [{ email: event.data.email, locale: event.data.locale, name: event.data.firstName }],
    },
    notifyActor: true,
  },
}
