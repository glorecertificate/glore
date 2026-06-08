'use server'

import 'server-only'

import { randomBytes } from 'node:crypto'

import { cacheTag } from 'next/cache'

import { and, desc, eq, isNull, or } from 'drizzle-orm'
import { type Locale } from 'next-intl'

import { getCurrentUser } from '@/actions/user'
import { db, transaction } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { deleteUser } from '@/db/mutations/user'
import { parseUser, userWith } from '@/db/queries/user'
import { teamInvitations, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { CacheTag } from '@/lib/cache'
import { JOIN_ROOT } from '@/lib/constants'
import { sendMail } from '@/lib/email'

const INVITATION_EXPIRY_DAYS = 7

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

export const inviteTeamMember = async ({
  email,
  firstName,
  lastName,
  locale,
  role,
}: {
  email: string
  firstName: string
  lastName: string
  locale: Locale
  role: 'admin' | 'editor'
}) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can invite team members' }

  const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')

  const result = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password: randomBytes(32).toString('hex'),
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      locale,
    },
  })
  if (!result?.user) return { error: 'Failed to create user' }

  await db
    .update(users)
    .set({
      role: role === 'admin' ? 'admin' : 'user',
      isEditor: role === 'editor',
    })
    .where(eq(users.id, result.user.id))

  const token = randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  await db.insert(teamInvitations).values({
    userId: result.user.id,
    token,
    email,
    firstName: firstName.trim(),
    lastName: lastName.trim() || null,
    role,
    locale,
    invitedBy: currentUser.id,
    expiresAt,
  })

  const displayName = [firstName, lastName].filter(Boolean).join(' ')
  const joinUrl = `${process.env.APP_URL}${JOIN_ROOT}?token=${token}`

  try {
    await sendMail({
      to: email,
      template: {
        name: 'team/invite',
        props: { url: joinUrl, inviteeName: displayName, role: role as 'admin' | 'editor', userName: displayName },
      },
      locale: locale ?? undefined,
    })
  } catch (error) {
    console.error('Failed to send team invite email:', error)
    return { error: error instanceof Error ? error.message : 'Failed to send invitation email' }
  }

  return { data: { id: result.user.id, email, role } }
}

export const resendInvitation = async (userId: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can resend invitations' }

  const existing = await db.query.teamInvitations.findFirst({
    columns: { id: true, email: true, firstName: true, lastName: true, role: true, locale: true },
    where: and(eq(teamInvitations.userId, userId), isNull(teamInvitations.acceptedAt)),
    orderBy: desc(teamInvitations.createdAt),
  })
  if (!existing) return { error: 'No pending invitation found for this user' }

  const token = randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  await db
    .update(teamInvitations)
    .set({ token, expiresAt, updatedAt: new Date().toISOString() })
    .where(eq(teamInvitations.id, existing.id))

  const displayName = [existing.firstName, existing.lastName].filter(Boolean).join(' ')
  const joinUrl = `${process.env.APP_URL}/api/v1/join?token=${token}`

  try {
    await sendMail({
      to: existing.email,
      template: {
        name: 'team/invite',
        props: {
          url: joinUrl,
          inviteeName: displayName,
          role: existing.role as 'admin' | 'editor',
          userName: displayName,
        },
      },
      locale: existing.locale ?? undefined,
    })
  } catch (error) {
    console.error('Failed to resend team invite email:', error)
    return { error: error instanceof Error ? error.message : 'Failed to resend invitation email' }
  }

  return { data: { email: existing.email } }
}

export const updateTeamMemberRole = async (userId: string, role: 'admin' | 'editor') => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can update team member roles' }
  if (currentUser.id === userId) return { error: 'You cannot change your own role' }

  await db
    .update(users)
    .set({
      role: role === 'admin' ? 'admin' : 'user',
      isEditor: role === 'editor',
    })
    .where(eq(users.id, userId))

  return { data: { id: userId, role } }
}

export const deleteTeamMember = async (userId: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'You must be an admin to remove team members' }
  if (currentUser.id === userId) return { error: 'You cannot remove yourself from the team' }

  await transaction(tx => deleteUser(tx, userId, { reassignTo: currentUser.id }))

  return { data: { id: userId } }
}
