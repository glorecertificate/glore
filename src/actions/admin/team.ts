'use server'

import 'server-only'

import { randomBytes } from 'node:crypto'

import { cacheTag } from 'next/cache'

import { eq, or } from 'drizzle-orm'
import { z } from 'zod'

import { settleDeletedUser } from '@/actions/account/deletion'
import { adminAction, requireAdminWithLimit, revalidateUserAccess } from '@/actions/admin/helpers'
import { notify } from '@/actions/notifications/notify'
import { getCurrentUser } from '@/actions/user'
import { db, transaction } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { adminError, setPlatformRole } from '@/db/mutations/moderation'
import { createTeamInvitation, refreshTeamInvitation } from '@/db/mutations/team-invitation'
import { deleteUser } from '@/db/mutations/user'
import { parseUser, userWith } from '@/db/queries/user'
import { users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { CacheTag } from '@/lib/cache'
import { LOCALES } from '@/lib/i18n'
import { fullName } from '@/lib/utils'
import config from '~/config/app.json'

const TEAM_ROLES = ['admin', 'editor'] as const

const ROLE_FIELDS = {
  admin: { isEditor: false, role: 'admin' },
  editor: { isEditor: true, role: 'user' },
} as const satisfies Record<(typeof TEAM_ROLES)[number], { isEditor: boolean; role: string }>

const inviteSchema = z.object({
  email: z.email().trim().toLowerCase(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z
    .string()
    .trim()
    .max(100)
    .transform(value => value || null)
    .nullish()
    .transform(value => value ?? null),
  locale: z.enum(LOCALES),
  role: z.enum(TEAM_ROLES),
})

const teamRoleSchema = z.object({ role: z.enum(TEAM_ROLES), userId: z.string().min(1).max(200) })

const fetchTeamMembers = async () => {
  'use cache'
  cacheTag(CacheTag.TeamMembers)

  return await safeQuery(async () => {
    const result = await db.query.users.findMany({
      where: or(eq(users.role, 'admin'), eq(users.isEditor, true)),
      with: userWith,
      limit: 500,
    })
    return result.map(parseUser)
  })
}

export const getTeamMembers = async ({ cache = true }: { cache?: boolean } = {}) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { data: null, error: 'Forbidden' }

  if (!cache) {
    const result = await db.query.users.findMany({
      where: or(eq(users.role, 'admin'), eq(users.isEditor, true)),
      with: userWith,
      limit: 500,
    })
    return { data: result.map(parseUser), error: null }
  }
  return await fetchTeamMembers()
}

export const inviteTeamMember = async (input: z.input<typeof inviteSchema>) =>
  await adminAction(async () => {
    const actor = await requireAdminWithLimit('team-invite', 30)
    const parsed = inviteSchema.safeParse(input)
    if (!parsed.success) throw adminError('INVALID_INPUT')
    const { email, firstName, lastName, locale, role } = parsed.data

    const existing = await db.query.users.findFirst({ columns: { id: true }, where: eq(users.email, email) })
    if (existing) throw adminError('EMAIL_TAKEN')

    const created = await auth.api.signUpEmail({
      body: {
        email,
        firstName,
        lastName: lastName ?? undefined,
        locale,
        name: fullName({ firstName, lastName }),
        password: randomBytes(32).toString('hex'),
      },
    })

    const { event } = await transaction(async tx => {
      await tx.update(users).set(ROLE_FIELDS[role]).where(eq(users.id, created.user.id))
      return await createTeamInvitation(tx, {
        actorId: actor.id,
        email,
        expiryDays: config.invitationExpiryDays,
        firstName,
        lastName,
        locale,
        role,
        userId: created.user.id,
      })
    })
    revalidateUserAccess(created.user.id)

    const delivery = await notify(event)
    if (delivery.emailed === 0) throw adminError('SEND_FAILED')
    return { email, id: created.user.id, role }
  })

export const resendInvitation = async (userId: string) =>
  await adminAction(async () => {
    if (!userId || typeof userId !== 'string') throw adminError('INVALID_INPUT')
    const actor = await requireAdminWithLimit('team-resend', 30)

    const { event, invitation } = await transaction(tx =>
      refreshTeamInvitation(tx, { actorId: actor.id, expiryDays: config.invitationExpiryDays, userId })
    )

    const delivery = await notify(event)
    if (delivery.emailed === 0) throw adminError('SEND_FAILED')
    return { email: invitation.email, expiresAt: invitation.expiresAt }
  })

export const updateTeamMemberRole = async (userId: string, role: string) =>
  await adminAction(async () => {
    const actor = await requireAdminWithLimit('role', 60)
    const parsed = teamRoleSchema.safeParse({ role, userId })
    if (!parsed.success) throw adminError('INVALID_INPUT')

    const result = await transaction(tx =>
      setPlatformRole(tx, { actorId: actor.id, role: parsed.data.role, userId: parsed.data.userId })
    )
    revalidateUserAccess(parsed.data.userId)
    await notify(result.event)
    return { id: parsed.data.userId, role: result.role }
  })

export const deleteTeamMember = async (userId: string) =>
  await adminAction(async () => {
    if (!userId || typeof userId !== 'string') throw adminError('INVALID_INPUT')
    const actor = await requireAdminWithLimit('team-delete', 30)
    if (actor.id === userId) throw adminError('SELF')

    const deleted = await transaction(tx => deleteUser(tx, userId, { actorId: actor.id, reassignTo: actor.id }))
    await settleDeletedUser(deleted)

    revalidateUserAccess(userId)
    return { id: userId }
  })
