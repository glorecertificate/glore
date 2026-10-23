import 'server-only'

import { type MailCategory, type PlannedMail, type Recipient } from '@/actions/notifications/plan'
import {
  organizationMemberIds,
  organizationNameOf,
  platformAdminIds,
  usernameOf,
} from '@/actions/notifications/recipients'
import { type AppEvent, type EventType } from '@/db/queries/activity-event'
import { OPEN_INVITATION_ROOT } from '@/lib/constants'
import { type EmailTemplate } from '@/lib/email'

interface EventDefinition<K extends EventType> {
  inApp?: (event: AppEvent<K>) => Promise<string[]> | string[]
  email?: {
    category: MailCategory
    to: (event: AppEvent<K>) => Promise<Recipient[]> | Recipient[]
    template?: (event: AppEvent<K>, mail: PlannedMail, link: string | null) => EmailTemplate | Promise<EmailTemplate>
  }
  notifyActor?: boolean
  variant?: (event: AppEvent<K>, userId: string) => Promise<string | undefined> | string | undefined
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

const fallbackLink = (link: string | null) => link ?? `${process.env.APP_URL}/dashboard`

const certificateUrl = (event: { data: { certificateId: number } }) => `/certificates/${event.data.certificateId}`

const reviewUrl = (event: CertificateEvent) => `/certificates/${event.data.certificateId}/review`

export const EVENT_DEFINITIONS: { [K in EventType]: EventDefinition<K> } = {
  'certificate.submitted': {
    inApp: tutorOrPool,
    email: {
      category: 'mandatory',
      to: async event => users(...(await tutorOrPool(event))),
      template: (_event, mail, link) => ({
        name: 'certificate/assigned',
        props: { kind: 'submitted', url: link ?? undefined, userName: mail.name ?? undefined },
      }),
    },
    url: reviewUrl,
  },
  'certificate.assigned': {
    inApp: event => [event.data.tutorId, event.data.previousTutorId].filter((id): id is string => Boolean(id)),
    email: {
      category: 'mandatory',
      to: event => users(event.data.tutorId),
      template: (_event, mail, link) => ({
        name: 'certificate/assigned',
        props: { kind: 'assigned', url: link ?? undefined, userName: mail.name ?? undefined },
      }),
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
      template: (event, mail, link) => ({
        name: 'certificate/review',
        props: {
          status: 'changes_requested',
          comment: event.data.comment ?? undefined,
          url: link ?? undefined,
          userName: mail.name ?? undefined,
        },
      }),
    },
    url: certificateUrl,
  },
  'certificate.resubmitted': {
    inApp: tutorOrPool,
    email: {
      category: 'mandatory',
      to: async event => users(...(await tutorOrPool(event))),
      template: (_event, mail, link) => ({
        name: 'certificate/assigned',
        props: { kind: 'resubmitted', url: link ?? undefined, userName: mail.name ?? undefined },
      }),
    },
    url: reviewUrl,
  },
  'certificate.approved': {
    inApp: async event => [event.data.holderId, ...(await managers(event))],
    email: {
      category: 'mandatory',
      to: event => users(event.data.holderId),
      template: (event, mail, link) => ({
        name: 'certificate/review',
        props: {
          status: 'approved',
          documentUrl: event.data.documentUrl ?? undefined,
          url: link ?? undefined,
          userName: mail.name ?? undefined,
        },
      }),
    },
    url: certificateUrl,
  },
  'certificate.rejected': {
    inApp: event => [event.data.holderId],
    email: {
      category: 'mandatory',
      to: event => users(event.data.holderId),
      template: (event, mail, link) => ({
        name: 'certificate/decision',
        props: {
          kind: 'rejected',
          reason: event.data.reason,
          url: fallbackLink(link),
          userName: mail.name ?? undefined,
        },
      }),
    },
    url: certificateUrl,
  },
  'certificate.revoked': {
    inApp: event => (event.data.holderId ? [event.data.holderId] : []),
    email: {
      category: 'mandatory',
      to: event => users(event.data.holderId),
      template: (event, mail, link) => ({
        name: 'certificate/decision',
        props: {
          kind: 'revoked',
          reason: event.data.reason,
          url: fallbackLink(link),
          userName: mail.name ?? undefined,
        },
      }),
    },
    url: certificateUrl,
  },
  'certificate.withdrawn': {
    inApp: event => (event.data.tutorId ? [event.data.tutorId] : []),
    url: certificateUrl,
  },
  'certificate.review_reminder': {
    inApp: event => [event.data.tutorId],
    email: {
      category: 'reminders',
      to: event => users(event.data.tutorId),
      template: (event, mail, link) => ({
        name: 'certificate/reminder',
        props: { days: event.data.days, kind: 'reminder', url: fallbackLink(link), userName: mail.name ?? undefined },
      }),
    },
    url: reviewUrl,
  },
  'certificate.review_escalated': {
    inApp: managers,
    email: {
      category: 'reminders',
      to: async event => users(...(await managers(event))),
      template: (event, mail, link) => ({
        name: 'certificate/reminder',
        props: { days: event.data.days, kind: 'escalated', url: fallbackLink(link), userName: mail.name ?? undefined },
      }),
    },
    url: certificateUrl,
  },
  'learning.eligible': {
    inApp: event => [event.data.userId],
    email: {
      category: 'learning',
      to: event => users(event.data.userId),
      template: (_event, mail, link) => ({
        name: 'learning/eligible',
        props: { url: fallbackLink(link), userName: mail.name ?? undefined },
      }),
    },
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
        name: 'organization/application-decision',
        props: {
          comment: event.data.comment,
          organizationName: event.data.organizationName,
          status: event.data.approved ? 'approved' : 'rejected',
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
      template: (event, mail) => ({
        name: 'organization/invitation',
        props: {
          expiresAt: event.data.expiresAt,
          inviterName: event.data.inviterName,
          message: event.data.message,
          organizationName: event.data.organizationName,
          role: event.data.role,
          url: event.data.url,
          userName: mail.name ?? undefined,
        },
      }),
    },
    url: event => `${OPEN_INVITATION_ROOT}/${event.data.invitationId}`,
  },
  'invitation.accepted': {
    inApp: event => (event.data.inviterId ? [event.data.inviterId] : []),
    url: () => '/organization?tab=members',
    variant: async (_event, userId) => ((await platformAdminIds()).includes(userId) ? 'platform' : undefined),
  },
  'invitation.declined': {
    inApp: event => (event.data.inviterId ? [event.data.inviterId] : []),
    url: () => '/organization?tab=invitations',
  },
  'invitation.revoked': {},
  'invite_link.created': {},
  'invite_link.revoked': {},
  'invitation.expiring': {
    email: {
      category: 'reminders',
      to: event =>
        event.data.userId
          ? users(event.data.userId)
          : [{ email: event.data.email, locale: event.data.locale, name: null }],
      template: (event, mail) => ({
        name: 'organization/invitation',
        props: {
          expiresAt: event.data.expiresAt,
          kind: 'reminder',
          organizationName: event.data.organizationName,
          role: event.data.role,
          url: event.data.url,
          userName: mail.name ?? undefined,
        },
      }),
    },
  },
  'join_request.created': {
    inApp: managers,
    email: {
      category: 'organization',
      to: async event => users(...(await managers(event))),
      template: (event, mail, link) => ({
        name: 'organization/join-request-received',
        props: {
          organizationName: event.data.organizationName,
          requesterName: event.data.name,
          url: fallbackLink(link),
          userName: mail.name ?? undefined,
        },
      }),
    },
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
  'member.joined': {
    inApp: managers,
    url: () => '/organization?tab=members',
  },
  'member.role_changed': {
    inApp: event => [event.data.userId],
    email: {
      category: 'mandatory',
      to: event => users(event.data.userId),
      template: async (event, mail, link) => ({
        name: 'organization/membership',
        props: {
          kind: 'role_changed',
          organizationName: await organizationNameOf(event.organizationId),
          previousRole: event.data.previousRole,
          role: event.data.role,
          url: fallbackLink(link),
          userName: mail.name ?? undefined,
        },
      }),
    },
    url: () => '/organization',
  },
  'member.removed': {
    email: {
      category: 'mandatory',
      to: event => users(event.data.userId),
      template: async (event, mail, link) => ({
        name: 'organization/membership',
        props: {
          kind: 'removed',
          organizationName: await organizationNameOf(event.organizationId),
          url: fallbackLink(link),
          userName: mail.name ?? undefined,
        },
      }),
    },
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
      template: async (event, mail, link) => ({
        name: 'organization/membership',
        props: {
          kind: mail.userId === event.data.newOwnerId ? 'ownership_gained' : 'ownership_left',
          organizationName: await organizationNameOf(event.organizationId),
          url: fallbackLink(link),
          userName: mail.name ?? undefined,
        },
      }),
    },
    notifyActor: true,
    url: () => '/organization',
    variant: (event, userId) => (userId === event.data.newOwnerId ? 'gained' : 'left'),
  },
  'team.invited': {
    inApp: event => [event.data.userId],
    email: {
      category: 'mandatory',
      to: event => users(event.data.userId),
      template: event => ({
        name: 'team/invite',
        props: { inviterName: event.data.inviterName ?? 'GloRe', role: event.data.role, url: event.data.url },
      }),
    },
    url: () => '/dashboard',
  },
  'team.role_changed': {
    inApp: event => [event.data.userId],
    email: {
      category: 'mandatory',
      to: event => users(event.data.userId),
      template: (event, mail, link) => ({
        name: 'team/role-changed',
        props: { role: event.data.role, url: fallbackLink(link), userName: mail.name ?? undefined },
      }),
    },
    url: () => '/dashboard',
  },
  'account.welcome': {
    email: {
      category: 'mandatory',
      to: event => users(event.data.userId),
      template: async (event, mail, link) => ({
        name: 'account/welcome',
        props: {
          url: fallbackLink(link),
          userName: mail.name ?? undefined,
          username: await usernameOf(event.data.userId),
        },
      }),
    },
    notifyActor: true,
    url: () => '/dashboard',
  },
  'account.suspended': {
    email: {
      category: 'mandatory',
      to: event => users(event.data.userId),
      template: (event, mail) => ({
        name: 'account/status',
        props: {
          expiresAt: event.data.expiresAt,
          kind: 'suspended',
          reason: event.data.reason,
          userName: mail.name ?? undefined,
        },
      }),
    },
  },
  'account.reinstated': {},
  'impersonation.started': {},
  'impersonation.stopped': {},
  'account.deleted': {
    email: {
      category: 'mandatory',
      to: event => [{ email: event.data.email, locale: event.data.locale, name: event.data.firstName }],
      template: (_event, mail) => ({
        name: 'account/status',
        props: { kind: 'deleted', userName: mail.name ?? undefined },
      }),
    },
    notifyActor: true,
  },
}
