import 'server-only'

import { createHash, randomBytes, randomUUID } from 'node:crypto'

import { and, count, eq, gt, isNull, lt, or, sql } from 'drizzle-orm'

import { type Transaction } from '@/db/client'
import { recordEvent } from '@/db/mutations/activity-event'
import { type AppEvent } from '@/db/queries/activity-event'
import {
  type InvitationErrorCode,
  type OrganizationMembershipRole,
  invitationState,
  inviteLinkState,
} from '@/db/queries/organization'
import {
  accounts,
  memberships,
  organizationInvitations,
  organizationInviteLinks,
  organizationJoinRequests,
  organizations,
  users,
  verifications,
} from '@/db/schema'
import { INVITE_ROOT, JOIN_LINK_ROOT } from '@/lib/constants'
import { hashToken, issueToken, openToken } from '@/lib/secret-token'
import { fullName } from '@/lib/utils'

const DAY = 24 * 60 * 60 * 1000
const RESEND_COOLDOWN = 60 * 1000

const ROLE_RANK = {
  admin: 4,
  learner: 0,
  representative: 3,
  tutor: 2,
  volunteer: 1,
} satisfies Record<OrganizationMembershipRole, number>

const ERROR_MESSAGES = {
  ACCEPTED: 'This invitation was already accepted',
  ACCOUNT_EXISTS: 'An account with this email already exists',
  ALREADY_INVITED: 'This person already has a pending invitation',
  ALREADY_MEMBER: 'This person is already a member of the organization',
  ALREADY_REQUESTED: 'A request to join is already pending',
  AUTH_ERROR: 'Sign in failed',
  DECLINED: 'This invitation was declined',
  EXPIRED: 'This invitation has expired',
  FORBIDDEN: 'You do not have permission to do this',
  INVALID: 'These values are not valid',
  LINK_EXHAUSTED: 'This invite link reached its limit',
  LINK_EXPIRED: 'This invite link has expired',
  LINK_REVOKED: 'This invite link was revoked',
  MISMATCH: 'This invitation was sent to a different account',
  NOT_FOUND: 'Not found',
  PROOF_REQUIRED: 'Confirm the email address first',
  RATE_LIMITED: 'Too many attempts',
  REQUEST_DECIDED: 'This request was already reviewed',
  REVOKED: 'This invitation was withdrawn',
  ROLE_TAKEN: 'This organization already has an owner',
  TOO_SOON: 'This invitation was sent a moment ago',
} satisfies Record<InvitationErrorCode, string>

export const invitationError = (code: InvitationErrorCode) => Object.assign(new Error(ERROR_MESSAGES[code]), { code })

export const isInvitationError = (error: unknown): error is Error & { code: InvitationErrorCode } =>
  error instanceof Error && 'code' in error && typeof error.code === 'string' && error.code in ERROR_MESSAGES

export const invitationUrl = (token: string, proof?: string) =>
  `${process.env.APP_URL}${INVITE_ROOT}/${token}${proof ? `?proof=${proof}` : ''}`

export const inviteLinkUrl = (token: string) => `${process.env.APP_URL}${JOIN_LINK_ROOT}/${token}`

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const revealInvitationToken = async (
  tx: Transaction,
  invitation: { id: number; tokenCipher: string | null }
) => {
  const opened = openToken(invitation.tokenCipher)
  if (opened) return opened
  const { token, tokenCipher, tokenHash } = issueToken()
  await tx
    .update(organizationInvitations)
    .set({ tokenCipher, tokenHash })
    .where(eq(organizationInvitations.id, invitation.id))
  return token
}

export const revealInviteLinkToken = async (tx: Transaction, link: { id: number; tokenCipher: string | null }) => {
  const opened = openToken(link.tokenCipher)
  if (opened) return opened
  const { token, tokenCipher, tokenHash } = issueToken()
  await tx
    .update(organizationInviteLinks)
    .set({ tokenCipher, tokenHash })
    .where(eq(organizationInviteLinks.id, link.id))
  return token
}

export const hashProof = (proof: string) => createHash('sha256').update(proof).digest('hex')

export const proofIdentifier = (invitationId: number) => `org-invite:${invitationId}`

const issueProof = async (tx: Transaction, invitationId: number, expiresAt: string) => {
  const proof = randomBytes(24).toString('base64url')
  const identifier = proofIdentifier(invitationId)
  await tx.delete(verifications).where(eq(verifications.identifier, identifier))
  await tx.insert(verifications).values({ expiresAt, id: randomUUID(), identifier, value: hashProof(proof) })
  return proof
}

const consumeProof = async (tx: Transaction, invitationId: number, proof: string | undefined) => {
  if (!proof) throw invitationError('PROOF_REQUIRED')
  const [consumed] = await tx
    .delete(verifications)
    .where(
      and(
        eq(verifications.identifier, proofIdentifier(invitationId)),
        eq(verifications.value, hashProof(proof)),
        gt(verifications.expiresAt, new Date().toISOString())
      )
    )
    .returning({ id: verifications.id })
  if (!consumed) throw invitationError('PROOF_REQUIRED')
}

const isoAfter = (days: number, from = Date.now()) => new Date(from + days * DAY).toISOString()

const openInvitation = and(
  isNull(organizationInvitations.acceptedAt),
  isNull(organizationInvitations.declinedAt),
  isNull(organizationInvitations.revokedAt)
)

const STATE_ERRORS = {
  accepted: 'ACCEPTED',
  declined: 'DECLINED',
  expired: 'EXPIRED',
  revoked: 'REVOKED',
} as const

export const assertPending = (invitation: Parameters<typeof invitationState>[0], now = Date.now()) => {
  const state = invitationState(invitation, now)
  if (state !== 'pending') throw invitationError(STATE_ERRORS[state])
}

interface Recipient {
  email: string
  id: string
}

const assertRecipient = (invitation: { email: string; userId: string | null }, user: Recipient) => {
  const matches = invitation.userId
    ? invitation.userId === user.id
    : normalizeEmail(invitation.email) === normalizeEmail(user.email)
  if (!matches) throw invitationError('MISMATCH')
}

const countOwners = async (tx: Transaction, organizationId: number) => {
  const [owners] = await tx
    .select({ total: count() })
    .from(memberships)
    .where(and(eq(memberships.organizationId, organizationId), eq(memberships.role, 'admin')))
  return owners?.total ?? 0
}

const isMember = async (tx: Transaction, organizationId: number, userId: string) => {
  const membership = await tx.query.memberships.findFirst({
    columns: { id: true },
    where: and(eq(memberships.organizationId, organizationId), eq(memberships.userId, userId)),
  })
  return Boolean(membership)
}

export const personName = async (tx: Transaction, userId: string | null) => {
  if (!userId) return null
  const person = await tx.query.users.findFirst({
    columns: { email: true, firstName: true, lastName: true },
    where: eq(users.id, userId),
  })
  return person ? fullName(person) || person.email : null
}

interface InvitationInput {
  email: string
  expiryDays: number
  invitedById: string | null
  organizationId: number
  role: OrganizationMembershipRole
  locale?: string | null
  message?: string | null
  refresh?: boolean
}

export const createInvitation = async (
  tx: Transaction,
  { email, expiryDays, invitedById, locale, message, organizationId, refresh, role }: InvitationInput
) => {
  const address = normalizeEmail(email)
  const organization = await tx.query.organizations.findFirst({
    columns: { id: true, name: true },
    where: eq(organizations.id, organizationId),
  })
  if (!organization) throw invitationError('NOT_FOUND')

  const account = await tx.query.users.findFirst({ columns: { id: true }, where: eq(users.email, address) })
  if (account && (await isMember(tx, organizationId, account.id))) throw invitationError('ALREADY_MEMBER')
  if (role === 'admin' && (await countOwners(tx, organizationId)) > 0) throw invitationError('ROLE_TAKEN')

  const now = Date.now()
  const nowIso = new Date(now).toISOString()
  const { token, tokenCipher, tokenHash } = issueToken()
  const values = {
    expiresAt: isoAfter(expiryDays, now),
    invitedById,
    lastSentAt: nowIso,
    locale: locale ?? null,
    message: message ?? null,
    role,
    tokenCipher,
    tokenHash,
    userId: account?.id ?? null,
  }

  const existing = await tx.query.organizationInvitations.findFirst({
    where: and(
      eq(organizationInvitations.organizationId, organizationId),
      sql`lower(${organizationInvitations.email}) = ${address}`,
      openInvitation
    ),
  })
  if (existing && !refresh && invitationState(existing, now) === 'pending') throw invitationError('ALREADY_INVITED')

  const [invitation] = existing
    ? await tx
        .update(organizationInvitations)
        .set(values)
        .where(eq(organizationInvitations.id, existing.id))
        .returning()
    : await tx
        .insert(organizationInvitations)
        .values({ ...values, email: address, organizationId })
        .returning()
  if (!invitation) throw new Error('Failed to create invitation')
  const proof = await issueProof(tx, invitation.id, invitation.expiresAt)

  const event = {
    type: 'invitation.sent',
    actorId: invitedById,
    organizationId,
    data: {
      email: address,
      expiresAt: invitation.expiresAt,
      invitationId: invitation.id,
      inviterId: invitedById,
      inviterName: await personName(tx, invitedById),
      locale: invitation.locale,
      message: invitation.message,
      organizationName: organization.name,
      role: invitation.role,
      url: invitationUrl(token, proof),
      userId: account?.id ?? null,
    },
  } satisfies AppEvent<'invitation.sent'>
  await recordEvent(tx, event)

  return { event, invitation, token }
}

export const resendInvitation = async (
  tx: Transaction,
  {
    actorId,
    expiryDays,
    invitationId,
    organizationId,
  }: { actorId: string; expiryDays: number; invitationId: number; organizationId: number }
) => {
  const current = await tx.query.organizationInvitations.findFirst({
    where: and(
      eq(organizationInvitations.id, invitationId),
      eq(organizationInvitations.organizationId, organizationId)
    ),
    with: { organization: { columns: { name: true } } },
  })
  if (!current) throw invitationError('NOT_FOUND')

  const now = Date.now()
  const state = invitationState(current, now)
  if (state !== 'pending' && state !== 'expired') throw invitationError(STATE_ERRORS[state])
  if (current.lastSentAt && now - Date.parse(`${current.lastSentAt.replace(' ', 'T')}Z`) < RESEND_COOLDOWN) {
    throw invitationError('TOO_SOON')
  }

  const { token, tokenCipher, tokenHash } = issueToken()
  const [invitation] = await tx
    .update(organizationInvitations)
    .set({ expiresAt: isoAfter(expiryDays, now), lastSentAt: new Date(now).toISOString(), tokenCipher, tokenHash })
    .where(and(eq(organizationInvitations.id, current.id), openInvitation))
    .returning()
  if (!invitation) throw invitationError('REVOKED')
  const proof = await issueProof(tx, invitation.id, invitation.expiresAt)

  const event = {
    type: 'invitation.sent',
    actorId,
    organizationId,
    data: {
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      invitationId: invitation.id,
      inviterId: invitation.invitedById,
      inviterName: await personName(tx, invitation.invitedById),
      locale: invitation.locale,
      message: invitation.message,
      organizationName: current.organization.name,
      role: invitation.role,
      url: invitationUrl(token, proof),
      userId: invitation.userId,
    },
  } satisfies AppEvent<'invitation.sent'>
  await recordEvent(tx, event)

  return { event, invitation, token }
}

export const revokeInvitation = async (
  tx: Transaction,
  { actorId, invitationId, organizationId }: { actorId: string; invitationId: number; organizationId: number }
) => {
  const [invitation] = await tx
    .update(organizationInvitations)
    .set({ revokedAt: new Date().toISOString() })
    .where(
      and(
        eq(organizationInvitations.id, invitationId),
        eq(organizationInvitations.organizationId, organizationId),
        openInvitation
      )
    )
    .returning()

  if (!invitation) {
    const current = await tx.query.organizationInvitations.findFirst({
      where: and(
        eq(organizationInvitations.id, invitationId),
        eq(organizationInvitations.organizationId, organizationId)
      ),
    })
    if (!current) throw invitationError('NOT_FOUND')
    const state = invitationState(current)
    if (state === 'pending') throw invitationError('INVALID')
    throw invitationError(STATE_ERRORS[state])
  }

  const event = {
    type: 'invitation.revoked',
    actorId,
    organizationId,
    data: { invitationId: invitation.id, userId: invitation.userId },
  } satisfies AppEvent<'invitation.revoked'>
  await recordEvent(tx, event)

  return { event, invitation }
}

const joinOrganization = async (
  tx: Transaction,
  { organizationId, role, userId }: { organizationId: number; role: OrganizationMembershipRole; userId: string }
) => {
  const where = and(eq(memberships.organizationId, organizationId), eq(memberships.userId, userId))
  const [current] = await tx.select({ role: memberships.role }).from(memberships).where(where).for('update')
  if (!current) {
    await tx.insert(memberships).values({ organizationId, role, userId }).onConflictDoNothing()
    return
  }
  if (ROLE_RANK[role] <= ROLE_RANK[current.role]) return
  await tx.update(memberships).set({ role }).where(where)
}

const claimInvitation = async (
  tx: Transaction,
  invitation: { id: number; organizationId: number; role: OrganizationMembershipRole },
  userId: string
) => {
  if (invitation.role === 'admin') {
    const owner = await tx.query.memberships.findFirst({
      columns: { userId: true },
      where: and(eq(memberships.organizationId, invitation.organizationId), eq(memberships.role, 'admin')),
    })
    if (owner && owner.userId !== userId) throw invitationError('ROLE_TAKEN')
  }

  const nowIso = new Date().toISOString()
  const [claimed] = await tx
    .update(organizationInvitations)
    .set({ acceptedAt: nowIso, userId })
    .where(
      and(eq(organizationInvitations.id, invitation.id), openInvitation, gt(organizationInvitations.expiresAt, nowIso))
    )
    .returning()
  if (!claimed) {
    const current = await tx.query.organizationInvitations.findFirst({
      where: eq(organizationInvitations.id, invitation.id),
    })
    if (current) assertPending(current)
    throw invitationError('INVALID')
  }

  await joinOrganization(tx, { organizationId: invitation.organizationId, role: invitation.role, userId })

  const event = {
    type: 'invitation.accepted',
    actorId: userId,
    organizationId: invitation.organizationId,
    data: { invitationId: claimed.id, inviterId: claimed.invitedById, userId },
  } satisfies AppEvent<'invitation.accepted'>
  await recordEvent(tx, event)

  return { event, invitation: claimed }
}

const findByToken = async (tx: Transaction, token: string) => {
  const invitation = await tx.query.organizationInvitations.findFirst({
    where: eq(organizationInvitations.tokenHash, hashToken(token)),
    with: { organization: { columns: { id: true, name: true } } },
  })
  if (!invitation) throw invitationError('NOT_FOUND')
  return invitation
}

export const acceptInvitation = async (tx: Transaction, { token, user }: { token: string; user: Recipient }) => {
  const invitation = await findByToken(tx, token)
  assertPending(invitation)
  assertRecipient(invitation, user)

  const accepted = await claimInvitation(tx, invitation, user.id)
  return { ...accepted, organization: invitation.organization }
}

export const openRecipientInvitation = async (
  tx: Transaction,
  { invitationId, user }: { invitationId: number; user: Recipient }
) => {
  const invitation = await tx.query.organizationInvitations.findFirst({
    where: eq(organizationInvitations.id, invitationId),
  })
  if (!invitation) throw invitationError('NOT_FOUND')
  assertPending(invitation)
  assertRecipient(invitation, user)
  return await revealInvitationToken(tx, invitation)
}

export const renewInvitationProof = async (tx: Transaction, { token }: { token: string }) => {
  const invitation = await findByToken(tx, token)
  assertPending(invitation)

  const address = normalizeEmail(invitation.email)
  const taken = await tx.query.users.findFirst({ columns: { id: true }, where: eq(users.email, address) })
  if (taken) throw invitationError('ACCOUNT_EXISTS')

  const proof = await issueProof(tx, invitation.id, invitation.expiresAt)
  return {
    email: address,
    invitation,
    locale: invitation.locale,
    url: invitationUrl(token, proof),
  }
}

export const acceptInvitationWithNewAccount = async (
  tx: Transaction,
  { passwordHash, proof, token }: { passwordHash: string; proof?: string; token: string }
) => {
  const invitation = await findByToken(tx, token)
  assertPending(invitation)

  const address = normalizeEmail(invitation.email)
  const taken = await tx.query.users.findFirst({ columns: { id: true }, where: eq(users.email, address) })
  if (taken) throw invitationError('ACCOUNT_EXISTS')
  await consumeProof(tx, invitation.id, proof)

  const userId = crypto.randomUUID()
  const nowIso = new Date().toISOString()
  await tx.insert(users).values({
    email: address,
    emailVerified: true,
    firstName: '',
    id: userId,
    locale: invitation.locale,
    name: '',
  })
  await tx.insert(accounts).values({
    accountId: userId,
    createdAt: nowIso,
    id: crypto.randomUUID(),
    password: passwordHash,
    providerId: 'credential',
    updatedAt: nowIso,
    userId,
  })

  const accepted = await claimInvitation(tx, invitation, userId)
  return { ...accepted, email: address, organization: invitation.organization, userId }
}

export const declineInvitation = async (
  tx: Transaction,
  { token, user }: { token: string; user: Recipient | null }
) => {
  const invitation = await findByToken(tx, token)
  assertPending(invitation)
  if (user) assertRecipient(invitation, user)

  const [declined] = await tx
    .update(organizationInvitations)
    .set({ declinedAt: new Date().toISOString() })
    .where(and(eq(organizationInvitations.id, invitation.id), openInvitation))
    .returning()
  if (!declined) throw invitationError('INVALID')

  const event = {
    type: 'invitation.declined',
    actorId: user?.id ?? null,
    organizationId: invitation.organizationId,
    data: { invitationId: declined.id, inviterId: declined.invitedById, userId: user?.id ?? declined.userId },
  } satisfies AppEvent<'invitation.declined'>
  await recordEvent(tx, event)

  return { event, invitation: declined }
}

export const createInviteLink = async (
  tx: Transaction,
  {
    createdById,
    expiryDays,
    maxUses,
    organizationId,
    requiresApproval,
    role,
  }: {
    createdById: string
    expiryDays: number | null
    maxUses: number | null
    organizationId: number
    requiresApproval: boolean
    role: OrganizationMembershipRole
  }
) => {
  if (role !== 'volunteer' && role !== 'learner') throw invitationError('INVALID')

  const { token, tokenCipher, tokenHash } = issueToken()
  const [link] = await tx
    .insert(organizationInviteLinks)
    .values({
      createdById,
      expiresAt: expiryDays ? isoAfter(expiryDays) : null,
      maxUses,
      organizationId,
      requiresApproval,
      role,
      tokenCipher,
      tokenHash,
    })
    .returning()
  if (!link) throw new Error('Failed to create invite link')

  const event = {
    type: 'invite_link.created',
    actorId: createdById,
    organizationId,
    data: { inviteLinkId: link.id, requiresApproval: link.requiresApproval, role: link.role },
  } satisfies AppEvent<'invite_link.created'>
  await recordEvent(tx, event)

  return { event, link, token }
}

export const revokeInviteLink = async (
  tx: Transaction,
  { actorId, inviteLinkId, organizationId }: { actorId: string; inviteLinkId: number; organizationId: number }
) => {
  const [link] = await tx
    .update(organizationInviteLinks)
    .set({ revokedAt: new Date().toISOString() })
    .where(
      and(
        eq(organizationInviteLinks.id, inviteLinkId),
        eq(organizationInviteLinks.organizationId, organizationId),
        isNull(organizationInviteLinks.revokedAt)
      )
    )
    .returning()

  if (!link) {
    const current = await tx.query.organizationInviteLinks.findFirst({
      columns: { id: true },
      where: and(
        eq(organizationInviteLinks.id, inviteLinkId),
        eq(organizationInviteLinks.organizationId, organizationId)
      ),
    })
    throw invitationError(current ? 'LINK_REVOKED' : 'NOT_FOUND')
  }

  const event = {
    type: 'invite_link.revoked',
    actorId,
    organizationId,
    data: { inviteLinkId: link.id },
  } satisfies AppEvent<'invite_link.revoked'>
  await recordEvent(tx, event)

  return { event, link }
}

const LINK_STATE_ERRORS = { exhausted: 'LINK_EXHAUSTED', expired: 'LINK_EXPIRED', revoked: 'LINK_REVOKED' } as const

export const assertLinkActive = (link: Parameters<typeof inviteLinkState>[0]) => {
  const state = inviteLinkState(link)
  if (state !== 'active') throw invitationError(LINK_STATE_ERRORS[state])
}

export interface LinkApplicant {
  email: string
  firstName: string
  lastName?: string | null
  locale?: string | null
  userId?: string | null
}

export const joinThroughInviteLink = async (
  tx: Transaction,
  { applicant, expiryDays, token }: { applicant: LinkApplicant; expiryDays: number; token: string }
) => {
  const link = await tx.query.organizationInviteLinks.findFirst({
    where: eq(organizationInviteLinks.tokenHash, hashToken(token)),
    with: { organization: { columns: { approvedAt: true, id: true, name: true } } },
  })
  if (!link?.organization.approvedAt) throw invitationError('NOT_FOUND')

  assertLinkActive(link)

  const email = normalizeEmail(applicant.email)
  const signedIn = Boolean(applicant.userId)
  const account = await tx.query.users.findFirst({ columns: { id: true }, where: eq(users.email, email) })
  const alreadyMember = account ? await isMember(tx, link.organizationId, account.id) : false
  if (alreadyMember) {
    if (signedIn) throw invitationError('ALREADY_MEMBER')
    return { kind: 'noop' as const }
  }

  const claimUse = async () => {
    const nowIso = new Date().toISOString()
    const [claimed] = await tx
      .update(organizationInviteLinks)
      .set({ uses: sql`${organizationInviteLinks.uses} + 1` })
      .where(
        and(
          eq(organizationInviteLinks.id, link.id),
          isNull(organizationInviteLinks.revokedAt),
          or(isNull(organizationInviteLinks.expiresAt), gt(organizationInviteLinks.expiresAt, nowIso)),
          or(isNull(organizationInviteLinks.maxUses), lt(organizationInviteLinks.uses, organizationInviteLinks.maxUses))
        )
      )
      .returning({ id: organizationInviteLinks.id })
    if (!claimed) throw invitationError('LINK_EXHAUSTED')
  }

  if (!link.requiresApproval && signedIn && applicant.userId) {
    await tx
      .insert(memberships)
      .values({ organizationId: link.organizationId, role: link.role, userId: applicant.userId })
      .onConflictDoNothing()
    await claimUse()
    const event = {
      type: 'member.joined',
      actorId: applicant.userId,
      organizationId: link.organizationId,
      data: { role: link.role, userId: applicant.userId, via: 'link' },
    } satisfies AppEvent<'member.joined'>
    await recordEvent(tx, event)
    return { kind: 'joined' as const, event, organization: link.organization }
  }

  if (!link.requiresApproval) {
    try {
      const { event, invitation } = await createInvitation(tx, {
        email,
        expiryDays,
        invitedById: link.createdById,
        locale: applicant.locale,
        organizationId: link.organizationId,
        role: link.role,
      })
      await claimUse()
      return { kind: 'invited' as const, event, invitation }
    } catch (error) {
      if (isInvitationError(error) && error.code === 'ALREADY_INVITED') return { kind: 'noop' as const }
      throw error
    }
  }

  const pending = await tx.query.organizationJoinRequests.findFirst({
    columns: { id: true },
    where: and(
      eq(organizationJoinRequests.organizationId, link.organizationId),
      sql`lower(${organizationJoinRequests.email}) = ${email}`,
      eq(organizationJoinRequests.status, 'pending')
    ),
  })
  if (pending) {
    if (signedIn) throw invitationError('ALREADY_REQUESTED')
    return { kind: 'noop' as const }
  }

  const [request] = await tx
    .insert(organizationJoinRequests)
    .values({
      email,
      firstName: applicant.firstName.trim() || email.split('@')[0] || email,
      inviteLinkId: link.id,
      lastName: applicant.lastName?.trim() || null,
      locale: applicant.locale ?? null,
      organizationId: link.organizationId,
      role: link.role,
      userId: applicant.userId ?? null,
    })
    .returning()
  if (!request) throw new Error('Failed to create join request')
  await claimUse()

  const event = {
    type: 'join_request.created',
    actorId: applicant.userId ?? null,
    organizationId: link.organizationId,
    data: {
      email,
      joinRequestId: request.id,
      name: fullName(request) || email,
      organizationName: link.organization.name,
    },
  } satisfies AppEvent<'join_request.created'>
  await recordEvent(tx, event)

  return { kind: 'requested' as const, event, request }
}

export const approveJoinRequest = async (
  tx: Transaction,
  {
    comment,
    expiryDays,
    organizationId,
    requestId,
    reviewerId,
  }: { expiryDays: number; organizationId: number; requestId: number; reviewerId: string; comment?: string | null }
) => {
  const request = await tx.query.organizationJoinRequests.findFirst({
    where: and(eq(organizationJoinRequests.id, requestId), eq(organizationJoinRequests.organizationId, organizationId)),
    with: { organization: { columns: { name: true } } },
  })
  if (!request) throw invitationError('NOT_FOUND')
  if (request.status !== 'pending') throw invitationError('REQUEST_DECIDED')

  const nowIso = new Date().toISOString()
  const [decided] = await tx
    .update(organizationJoinRequests)
    .set({
      acceptedAt: nowIso,
      reviewedAt: nowIso,
      reviewedBy: reviewerId,
      reviewerComment: comment ?? null,
      status: 'accepted',
    })
    .where(and(eq(organizationJoinRequests.id, request.id), eq(organizationJoinRequests.status, 'pending')))
    .returning({ id: organizationJoinRequests.id })
  if (!decided) throw invitationError('REQUEST_DECIDED')

  const decision = {
    accepted: true,
    comment: comment ?? null,
    email: request.email,
    joinRequestId: request.id,
    locale: request.locale,
    name: fullName(request) || request.email,
    organizationName: request.organization.name,
  }

  if (request.userId) {
    await tx
      .insert(memberships)
      .values({ organizationId, role: request.role, userId: request.userId })
      .onConflictDoNothing()
    const joinedEvent = {
      type: 'member.joined',
      actorId: reviewerId,
      organizationId,
      data: { role: request.role, userId: request.userId, via: 'request' },
    } satisfies AppEvent<'member.joined'>
    const memberDecidedEvent = {
      type: 'join_request.decided',
      actorId: reviewerId,
      organizationId,
      data: { ...decision, url: null, userId: request.userId },
    } satisfies AppEvent<'join_request.decided'>
    await recordEvent(tx, joinedEvent)
    await recordEvent(tx, memberDecidedEvent)
    return { decidedEvent: memberDecidedEvent, joinedEvent, kind: 'member' as const }
  }

  const { event: invitationEvent, invitation } = await createInvitation(tx, {
    email: request.email,
    expiryDays,
    invitedById: reviewerId,
    locale: request.locale,
    organizationId,
    refresh: true,
    role: request.role,
  })
  const decidedEvent = {
    type: 'join_request.decided',
    actorId: reviewerId,
    organizationId,
    data: { ...decision, url: invitationEvent.data.url, userId: null },
  } satisfies AppEvent<'join_request.decided'>
  await recordEvent(tx, decidedEvent)
  return { decidedEvent, invitation, invitationEvent, kind: 'invitation' as const }
}

export const rejectJoinRequest = async (
  tx: Transaction,
  {
    comment,
    organizationId,
    requestId,
    reviewerId,
  }: { organizationId: number; requestId: number; reviewerId: string; comment?: string | null }
) => {
  const request = await tx.query.organizationJoinRequests.findFirst({
    where: and(eq(organizationJoinRequests.id, requestId), eq(organizationJoinRequests.organizationId, organizationId)),
    with: { organization: { columns: { name: true } } },
  })
  if (!request) throw invitationError('NOT_FOUND')
  if (request.status !== 'pending') throw invitationError('REQUEST_DECIDED')

  const nowIso = new Date().toISOString()
  const [decided] = await tx
    .update(organizationJoinRequests)
    .set({
      rejectedAt: nowIso,
      reviewedAt: nowIso,
      reviewedBy: reviewerId,
      reviewerComment: comment ?? null,
      status: 'rejected',
    })
    .where(and(eq(organizationJoinRequests.id, request.id), eq(organizationJoinRequests.status, 'pending')))
    .returning({ id: organizationJoinRequests.id })
  if (!decided) throw invitationError('REQUEST_DECIDED')

  const event = {
    type: 'join_request.decided',
    actorId: reviewerId,
    organizationId,
    data: {
      accepted: false,
      comment: comment ?? null,
      email: request.email,
      joinRequestId: request.id,
      locale: request.locale,
      name: fullName(request) || request.email,
      organizationName: request.organization.name,
      url: null,
      userId: request.userId,
    },
  } satisfies AppEvent<'join_request.decided'>
  await recordEvent(tx, event)

  return { event, request }
}
