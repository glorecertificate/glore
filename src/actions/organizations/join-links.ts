'use server'

import 'server-only'

import { revalidateTag } from 'next/cache'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { getAuthUser } from '@/actions/auth'
import { setCookie } from '@/actions/cookies'
import { notify } from '@/actions/notifications/notify'
import { expireUserAccess } from '@/actions/organizations/helpers'
import { failure, guarded } from '@/actions/organizations/invite-core'
import { db, transaction } from '@/db/client'
import { invitationError, joinThroughInviteLink } from '@/db/mutations/invitation'
import { users } from '@/db/schema'
import { CacheTag } from '@/lib/cache'
import { LOCALES } from '@/lib/i18n'
import { clientAddress, isRateLimited } from '@/lib/rate-limit'
import { hashToken } from '@/lib/secret-token'
import config from '~/config/app.json'

const HOUR = 60 * 60 * 1000

export const joinOrganizationThroughLink = async (token: string) =>
  await guarded(async () => {
    const user = await getAuthUser()
    if (!user) throw invitationError('AUTH_ERROR')

    const profile = await db.query.users.findFirst({
      columns: { firstName: true, lastName: true, locale: true },
      where: eq(users.id, user.id),
    })
    const outcome = await transaction(tx =>
      joinThroughInviteLink(tx, {
        applicant: {
          email: user.email,
          firstName: profile?.firstName ?? '',
          lastName: profile?.lastName,
          locale: profile?.locale,
          userId: user.id,
        },
        expiryDays: config.invitationExpiryDays,
        token,
      })
    )

    if (outcome.kind === 'joined') {
      await notify(outcome.event)
      expireUserAccess([user.id])
      revalidateTag(CacheTag.Organizations, 'max')
      await setCookie('org', outcome.organization.id)
      return { kind: 'joined' as const }
    }

    if (outcome.kind === 'requested') await notify(outcome.event)
    return { kind: 'requested' as const }
  })

const guestSchema = z.object({
  email: z.email().max(254),
  firstName: z.string().trim().min(1).max(100),
  lastName: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform(value => value || null),
  locale: z.enum(LOCALES).optional(),
  token: z.string().min(8).max(200),
})

export const requestOrganizationAccess = async (input: z.input<typeof guestSchema>) => {
  const parsed = guestSchema.safeParse(input)
  if (!parsed.success) return failure('INVALID')
  const { email, firstName, lastName, locale, token } = parsed.data

  const address = await clientAddress()
  const [byAddress, byEmail, byToken] = await Promise.all([
    isRateLimited(`join-link:ip:${address}`, 5, HOUR),
    isRateLimited(`join-link:email:${email.toLowerCase()}`, 3, HOUR),
    isRateLimited(`join-link:token:${hashToken(token).slice(0, 32)}`, 60, HOUR),
  ])
  if (byAddress || byEmail || byToken) return failure('RATE_LIMITED')

  return await guarded(async () => {
    const outcome = await transaction(tx =>
      joinThroughInviteLink(tx, {
        applicant: { email, firstName, lastName, locale },
        expiryDays: config.invitationExpiryDays,
        token,
      })
    )

    if (outcome.kind === 'invited' || outcome.kind === 'requested') await notify(outcome.event)
    return { sent: true }
  })
}
