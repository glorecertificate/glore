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
import { CacheTag, userTag } from '@/lib/cache'
import { AUTH_ROOT } from '@/lib/constants'
import { sendMail } from '@/lib/email'

const fetchUser = async (id: string) => {
  'use cache'
  cacheTag(userTag(id))

  return await safeQuery(async () => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: userWith,
    })
    if (!user) throw new Error('User not found')
    return parseUser(user)
  })
}

export const findUserEmail = async (username: string) => {
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

export const findUser = async (id: string, { cache: useCache = true }: { cache?: boolean } = {}) => {
  if (!useCache) {
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

export const updateUser = async (id: string, values: TableUpdate<'users'>, previousEmail?: string) => {
  const currentUser = await getCurrentUser()
  if (currentUser.id !== id && !currentUser.isAdmin) throw new Error('Forbidden')

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
  const [user, stored] = await Promise.all([getCurrentUser(), getCookie('org')])
  const match = user.organizations.find(({ id }) => id === stored)
  return (match ?? user.organizations[0])?.id ?? null
}

export const deleteAccount = async () => {
  const user = await getCurrentUser()

  const adminMemberships = await db
    .select({ organizationId: memberships.organizationId })
    .from(memberships)
    .where(and(eq(memberships.userId, user.id), eq(memberships.role, 'admin')))

  const otherAdmins = await Promise.all(
    adminMemberships.map(m =>
      db.query.memberships.findFirst({
        where: and(
          eq(memberships.organizationId, m.organizationId),
          eq(memberships.role, 'admin'),
          ne(memberships.userId, user.id)
        ),
      })
    )
  )
  if (otherAdmins.some(a => !a)) throw new Error('SOLE_ORG_ADMIN')

  const cert = await db.query.certificates.findFirst({
    where: eq(certificates.userId, user.id),
    columns: { id: true },
  })
  if (cert) throw new Error('HAS_CERTIFICATES')

  await Promise.all([
    db.delete(userAssessments).where(eq(userAssessments.userId, user.id)),
    db.delete(userEvaluations).where(eq(userEvaluations.userId, user.id)),
    db.delete(userAnswers).where(eq(userAnswers.userId, user.id)),
    db.delete(userLessons).where(eq(userLessons.userId, user.id)),
    db.delete(userCourses).where(eq(userCourses.userId, user.id)),
    db.delete(contributions).where(eq(contributions.userId, user.id)),
    db
      .update(organizationJoinRequests)
      .set({ reviewedBy: null })
      .where(eq(organizationJoinRequests.reviewedBy, user.id)),
    db.update(certificates).set({ reviewerId: null }).where(eq(certificates.reviewerId, user.id)),
    db.delete(users).where(eq(users.id, user.id)),
  ])

  redirect(AUTH_ROOT)
}
