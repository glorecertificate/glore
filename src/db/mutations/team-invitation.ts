import 'server-only'

import { randomBytes } from 'node:crypto'

import { and, desc, eq, isNull } from 'drizzle-orm'

import { type Transaction } from '@/db/client'
import { recordEvent } from '@/db/mutations/activity-event'
import { personName } from '@/db/mutations/invitation'
import { adminError } from '@/db/mutations/moderation'
import { type AppEvent } from '@/db/queries/activity-event'
import { timestampMillis } from '@/db/queries/organization'
import { teamInvitations } from '@/db/schema'
import { JOIN_ROOT } from '@/lib/constants'
import { hashToken } from '@/lib/secret-token'
import { fullName } from '@/lib/utils'

const RESEND_COOLDOWN = 60 * 1000
const DAY = 24 * 60 * 60 * 1000

type TeamRole = 'admin' | 'editor'

const createToken = () => randomBytes(32).toString('base64url')

const teamInvitationUrl = (token: string) => `${process.env.APP_URL}${JOIN_ROOT}?token=${encodeURIComponent(token)}`

const invitedEvent = async (
  tx: Transaction,
  actorId: string,
  invitation: { email: string; firstName: string; lastName: string | null; role: string; token: string; userId: string }
) =>
  ({
    actorId,
    data: {
      email: invitation.email,
      inviterName: await personName(tx, actorId),
      name: fullName(invitation),
      role: invitation.role as TeamRole,
      url: teamInvitationUrl(invitation.token),
      userId: invitation.userId,
    },
    organizationId: null,
    type: 'team.invited',
  }) satisfies AppEvent<'team.invited'>

export const createTeamInvitation = async (
  tx: Transaction,
  {
    actorId,
    email,
    expiryDays,
    firstName,
    lastName,
    locale,
    role,
    userId,
  }: {
    actorId: string
    email: string
    expiryDays: number
    firstName: string
    lastName: string | null
    locale: string | null
    role: TeamRole
    userId: string
  }
) => {
  const now = Date.now()
  const token = createToken()
  const [invitation] = await tx
    .insert(teamInvitations)
    .values({
      email,
      expiresAt: new Date(now + expiryDays * DAY).toISOString(),
      firstName,
      invitedBy: actorId,
      lastName,
      locale,
      role,
      tokenHash: hashToken(token),
      updatedAt: new Date(now).toISOString(),
      userId,
    })
    .returning()
  if (!invitation) throw new Error('Failed to create the invitation')

  const event = await invitedEvent(tx, actorId, { ...invitation, token })
  await recordEvent(tx, event)
  return { event, invitation, token }
}

export const refreshTeamInvitation = async (
  tx: Transaction,
  { actorId, expiryDays, userId }: { actorId: string; expiryDays: number; userId: string }
) => {
  const [current] = await tx
    .select()
    .from(teamInvitations)
    .where(and(eq(teamInvitations.userId, userId), isNull(teamInvitations.acceptedAt)))
    .orderBy(desc(teamInvitations.createdAt), desc(teamInvitations.id))
    .limit(1)
    .for('update')
  if (!current) throw adminError('NOT_FOUND')

  const now = Date.now()
  if (now - timestampMillis(current.updatedAt) < RESEND_COOLDOWN) throw adminError('TOO_SOON')

  const token = createToken()
  const [invitation] = await tx
    .update(teamInvitations)
    .set({
      expiresAt: new Date(now + expiryDays * DAY).toISOString(),
      tokenHash: hashToken(token),
      updatedAt: new Date(now).toISOString(),
    })
    .where(eq(teamInvitations.id, current.id))
    .returning()
  if (!invitation) throw adminError('NOT_FOUND')

  const event = await invitedEvent(tx, actorId, { ...invitation, token })
  await recordEvent(tx, event)
  return { event, invitation, token }
}
