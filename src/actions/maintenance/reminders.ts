import 'server-only'

import { and, eq, gt, inArray, isNotNull, isNull } from 'drizzle-orm'

import {
  type FiredReviewEvent,
  type OpenReview,
  planInvitationReminders,
  planReviewActions,
} from '@/actions/maintenance/plan'
import { notify } from '@/actions/notifications/notify'
import { db, transaction } from '@/db/client'
import { mapSequential } from '@/db/helpers'
import { recordEvent } from '@/db/mutations/activity-event'
import { invitationUrl } from '@/db/mutations/invitation'
import { type AppEvent } from '@/db/queries/activity-event'
import { activityEvents, certificates, organizationInvitations } from '@/db/schema'
import config from '~/config/app.json'

const REVIEW_ACTIONS = {
  'certificate.review_escalated': 'escalated',
  'certificate.review_reminder': 'reminder',
} as const

const emit = async (event: AppEvent) => {
  await transaction(tx => recordEvent(tx, event))
  await notify(event)
}

export const sendReviewReminders = async (now = new Date()) => {
  const open: OpenReview[] = (
    await db
      .select({
        holderId: certificates.userId,
        id: certificates.id,
        organizationId: certificates.organizationId,
        reviewerId: certificates.reviewerId,
        submittedAt: certificates.submittedAt,
      })
      .from(certificates)
      .where(and(inArray(certificates.status, ['submitted', 'in_review']), isNotNull(certificates.submittedAt)))
  ).flatMap(({ holderId, submittedAt, ...row }) => (holderId && submittedAt ? [{ ...row, holderId, submittedAt }] : []))
  if (open.length === 0) return { escalated: 0, reminders: 0 }

  const events = await db
    .select({
      action: activityEvents.action,
      createdAt: activityEvents.createdAt,
      metadata: activityEvents.metadata,
      subjectId: activityEvents.subjectId,
    })
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.subjectType, 'certificate'),
        inArray(activityEvents.action, Object.keys(REVIEW_ACTIONS)),
        inArray(
          activityEvents.subjectId,
          open.map(({ id }) => String(id))
        )
      )
    )
  const fired: FiredReviewEvent[] = events.flatMap(({ action, createdAt, metadata, subjectId }) => {
    const kind = REVIEW_ACTIONS[action as keyof typeof REVIEW_ACTIONS]
    return kind && typeof metadata.days === 'number'
      ? [{ certificateId: Number(subjectId), createdAt, days: metadata.days, kind }]
      : []
  })

  const actions = planReviewActions({
    certificates: open,
    fired,
    now: now.getTime(),
    thresholds: config.reviewReminderDays,
  })

  await mapSequential(actions, async ({ certificate, days, kind }) => {
    const data = { certificateId: certificate.id, days, holderId: certificate.holderId }
    if (kind === 'reminder' && certificate.reviewerId) {
      await emit({
        actorId: null,
        data: { ...data, tutorId: certificate.reviewerId },
        organizationId: certificate.organizationId,
        type: 'certificate.review_reminder',
      })
      return
    }
    await emit({
      actorId: null,
      data: { ...data, tutorId: certificate.reviewerId },
      organizationId: certificate.organizationId,
      type: 'certificate.review_escalated',
    })
  })

  return {
    escalated: actions.filter(({ kind }) => kind === 'escalated').length,
    reminders: actions.filter(({ kind }) => kind === 'reminder').length,
  }
}

export const sendInvitationReminders = async (now = new Date()) => {
  const open = await db.query.organizationInvitations.findMany({
    where: and(
      isNull(organizationInvitations.acceptedAt),
      isNull(organizationInvitations.declinedAt),
      isNull(organizationInvitations.revokedAt),
      gt(organizationInvitations.expiresAt, now.toISOString())
    ),
    with: { organization: { columns: { name: true } } },
  })
  if (open.length === 0) return 0

  const events = await db
    .select({ createdAt: activityEvents.createdAt, subjectId: activityEvents.subjectId })
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.subjectType, 'invitation'),
        eq(activityEvents.action, 'invitation.expiring'),
        inArray(
          activityEvents.subjectId,
          open.map(({ id }) => String(id))
        )
      )
    )

  const due = planInvitationReminders({
    fired: events.map(({ createdAt, subjectId }) => ({ createdAt, invitationId: Number(subjectId) })),
    invitations: open,
    now: now.getTime(),
    reminderDay: config.invitationReminderDay,
  })

  await mapSequential(due, async invitation => {
    await emit({
      actorId: null,
      data: {
        email: invitation.email,
        expiresAt: invitation.expiresAt,
        invitationId: invitation.id,
        locale: invitation.locale,
        organizationName: invitation.organization.name,
        role: invitation.role,
        url: invitationUrl(invitation.token),
        userId: invitation.userId,
      },
      organizationId: invitation.organizationId,
      type: 'invitation.expiring',
    })
  })

  return due.length
}
