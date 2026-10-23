'use server'

import 'server-only'

import { randomBytes } from 'node:crypto'

import { revalidateTag } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { eq } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { applyUserLocale, setCookie } from '@/actions/cookies'
import { notify } from '@/actions/notifications/notify'
import { expireUserAccess } from '@/actions/organizations/helpers'
import { failure, guarded } from '@/actions/organizations/invite-core'
import { db, transaction } from '@/db/client'
import {
  acceptInvitation,
  acceptInvitationWithNewAccount,
  assertPending,
  declineInvitation,
  invitationError,
  normalizeEmail,
  renewInvitationProof,
} from '@/db/mutations/invitation'
import { type AppEvent } from '@/db/queries/activity-event'
import { organizationInvitations } from '@/db/schema'
import { auth } from '@/lib/auth'
import { CacheTag } from '@/lib/cache'
import { ONBOARDING_ROOT } from '@/lib/constants'
import { sendMail } from '@/lib/email'
import { clientAddress, isRateLimited } from '@/lib/rate-limit'
import { hashToken } from '@/lib/secret-token'

const HOUR = 60 * 60 * 1000
const SIGN_IN_WINDOW = 15 * 60 * 1000

const settleMembership = async ({
  event,
  organizationId,
  userId,
}: {
  event: AppEvent
  organizationId: number
  userId: string
}) => {
  await notify(event)
  expireUserAccess([userId])
  revalidateTag(CacheTag.Organizations, 'max')
  await setCookie('org', organizationId)
}

export const acceptOrganizationInvitation = async (token: string) =>
  await guarded(async () => {
    const user = await getAuthUser()
    if (!user) throw invitationError('AUTH_ERROR')

    const { event, organization } = await transaction(tx =>
      acceptInvitation(tx, { token, user: { email: user.email, id: user.id } })
    )
    await settleMembership({ event, organizationId: organization.id, userId: user.id })
    return { organizationId: organization.id, organizationName: organization.name }
  })

export const acceptOrganizationInvitationAsNewAccount = async ({ proof, token }: { proof?: string; token: string }) => {
  const address = await clientAddress()
  const [byAddress, byToken] = await Promise.all([
    isRateLimited(`invite-account:ip:${address}`, 10, HOUR),
    isRateLimited(`invite-account:token:${hashToken(token).slice(0, 32)}`, 10, HOUR),
  ])
  if (byAddress || byToken) return failure('RATE_LIMITED')

  const result = await guarded(async () => {
    if (await getAuthUser()) throw invitationError('MISMATCH')

    const password = randomBytes(32).toString('hex')
    const { password: hasher } = await auth.$context
    const accepted = await transaction(async tx =>
      acceptInvitationWithNewAccount(tx, { passwordHash: await hasher.hash(password), proof, token })
    )
    await auth.api.signInEmail({ body: { email: accepted.email, password }, headers: await headers() })
    await settleMembership({
      event: accepted.event,
      organizationId: accepted.organization.id,
      userId: accepted.userId,
    })
    return { organizationId: accepted.organization.id }
  })
  if (result.error) return result

  redirect(ONBOARDING_ROOT)
}

export const requestInvitationProof = async (token: string) => {
  const address = await clientAddress()
  const [byAddress, byToken] = await Promise.all([
    isRateLimited(`invite-proof:ip:${address}`, 10, HOUR),
    isRateLimited(`invite-proof:token:${hashToken(token).slice(0, 32)}`, 3, HOUR),
  ])
  if (byAddress || byToken) return failure('RATE_LIMITED')

  return await guarded(async () => {
    if (await getAuthUser()) throw invitationError('MISMATCH')

    const { email, locale, url } = await transaction(tx => renewInvitationProof(tx, { token }))
    await sendMail({ locale: locale ?? undefined, template: { name: 'auth/invite', props: { url } }, to: email })
    return { sent: true }
  })
}

export const declineOrganizationInvitation = async (token: string) => {
  const user = await getAuthUser()
  if (!user && (await isRateLimited(`invite-decline:ip:${await clientAddress()}`, 20, HOUR))) {
    return failure('RATE_LIMITED')
  }

  return await guarded(async () => {
    const { event, invitation } = await transaction(tx =>
      declineInvitation(tx, { token, user: user ? { email: user.email, id: user.id } : null })
    )
    await notify(event)
    return { id: invitation.id }
  })
}

export const signInToAcceptInvitation = async ({ password, token }: { password: string; token: string }) => {
  const invitation = await db.query.organizationInvitations.findFirst({
    columns: { acceptedAt: true, declinedAt: true, email: true, expiresAt: true, revokedAt: true },
    where: eq(organizationInvitations.tokenHash, hashToken(token)),
  })
  if (!invitation) return failure('NOT_FOUND')

  const email = normalizeEmail(invitation.email)
  const address = await clientAddress()
  const [byAddress, byEmail] = await Promise.all([
    isRateLimited(`login:ip:${address}`, 40, SIGN_IN_WINDOW),
    isRateLimited(`login:id:${email}`, 10, SIGN_IN_WINDOW),
  ])
  if (byAddress || byEmail) return failure('RATE_LIMITED')

  return await guarded(async () => {
    assertPending(invitation)
    const result = await auth.api.signInEmail({ body: { email, password }, headers: await headers() }).catch(() => null)
    if (!result) throw invitationError('AUTH_ERROR')

    await applyUserLocale(result.user.locale)
    return { signedIn: true }
  })
}
