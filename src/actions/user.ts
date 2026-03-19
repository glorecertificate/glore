'use server'

import 'server-only'

import { cacheTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { and, eq, ne, or } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { getCookie } from '@/actions/cookies'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { parseUser, userWith } from '@/db/queries/user'
import {
  certificates,
  contributions,
  memberships,
  organizationJoinRequests,
  userAnswers,
  userAssessments,
  userCourses,
  userEvaluations,
  userLessons,
  users,
} from '@/db/schema'
import { type TableUpdate } from '@/db/types'
import { CacheTag } from '@/lib/cache'
import { AUTH_ROOT } from '@/lib/constants'
import { sendMail } from '@/lib/email'

const fetchUser = async (id: string) => {
  'use cache'
  cacheTag(CacheTag.User)

  return await safeQuery(async () => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: userWith,
    })
    if (!user) throw new Error('User not found')
    return parseUser(user)
  })
}

const fetchUserEmail = async (username: string) => {
  'use cache'
  cacheTag(CacheTag.UserEmail)

  return await safeQuery(async () => {
    const user = await db.query.users.findFirst({
      columns: { email: true },
      where: or(eq(users.email, username), eq(users.username, username)),
    })
    return user ?? null
  })
}

export const getCurrentUser = cache(async () => {
  const user = await getAuthUser()
  if (!user) redirect(AUTH_ROOT)
  return await findUser(user.id)
})

export const findUser = async (id: string, { cache = true }: { cache?: boolean } = {}) => {
  if (!cache) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: userWith,
    })
    if (!user) throw new Error('User not found')
    return parseUser(user)
  }

  const { data, error } = await fetchUser(id)
  if (error || !data) throw error || new Error('User not found')

  return data
}

export const findUserEmail = async (username: string) => await fetchUserEmail(username)

export const updateUser = async (id: string, values: TableUpdate<'users'>, previousEmail?: string) => {
  const [updated] = await db.update(users).set(values).where(eq(users.id, id)).returning()
  if (!updated) throw new Error('Failed to update user')

  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: userWith,
  })
  if (!user) throw new Error('User not found')

  const parsed = parseUser(user)

  if (values.email && previousEmail && values.email !== previousEmail) {
    const userName = parsed.firstName ?? undefined

    await sendMail({
      to: values.email,
      template: {
        name: 'account/email-changed',
        props: { oldEmail: previousEmail, newEmail: values.email, type: 'new', userName },
      },
    })

    await sendMail({
      to: previousEmail,
      template: {
        name: 'account/email-changed',
        props: { oldEmail: previousEmail, newEmail: values.email, type: 'old', userName },
      },
    })
  }

  return parsed
}

export const getActiveOrgId = async () => {
  const user = await getCurrentUser()
  const stored = await getCookie('org')
  const match = user.organizations.find(({ id }) => id === stored)
  return (match ?? user.organizations[0])?.id ?? null
}

export const deleteAccount = async () => {
  const user = await getCurrentUser()

  const adminMemberships = await db
    .select({ organizationId: memberships.organizationId })
    .from(memberships)
    .where(and(eq(memberships.userId, user.id), eq(memberships.role, 'admin')))

  for (const m of adminMemberships) {
    const otherAdmin = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.organizationId, m.organizationId),
        eq(memberships.role, 'admin'),
        ne(memberships.userId, user.id)
      ),
    })
    if (!otherAdmin) throw new Error('SOLE_ORG_ADMIN')
  }

  const cert = await db.query.certificates.findFirst({
    where: eq(certificates.userId, user.id),
    columns: { id: true },
  })
  if (cert) throw new Error('HAS_CERTIFICATES')

  await db.delete(userAssessments).where(eq(userAssessments.userId, user.id))
  await db.delete(userEvaluations).where(eq(userEvaluations.userId, user.id))
  await db.delete(userAnswers).where(eq(userAnswers.userId, user.id))
  await db.delete(userLessons).where(eq(userLessons.userId, user.id))
  await db.delete(userCourses).where(eq(userCourses.userId, user.id))
  await db.delete(contributions).where(eq(contributions.userId, user.id))

  await db
    .update(organizationJoinRequests)
    .set({ reviewedBy: null })
    .where(eq(organizationJoinRequests.reviewedBy, user.id))

  await db.update(certificates).set({ reviewerId: null }).where(eq(certificates.reviewerId, user.id))

  await db.delete(users).where(eq(users.id, user.id))

  redirect(AUTH_ROOT)
}
