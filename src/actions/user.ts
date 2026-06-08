'use server'

import 'server-only'

import { cacheTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { and, eq, inArray, ne, or } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { getCookie } from '@/actions/cookies'
import { db, transaction } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { deleteUser } from '@/db/mutations/user'
import { parseUser, userWith } from '@/db/queries/user'
import { certificates, memberships, users } from '@/db/schema'
import { type TableUpdate } from '@/db/types'
import { CacheTag, userTag } from '@/lib/cache'
import { AUTH_ROOT } from '@/lib/constants'
import { sendMail } from '@/lib/email'

const queryUserById = async (id: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: userWith,
  })
  if (!user) throw new Error('User not found')
  return parseUser(user)
}

const fetchUser = async (id: string) => {
  'use cache'
  cacheTag(userTag(id))

  return await safeQuery(() => queryUserById(id))
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
  if (!useCache) return await queryUserById(id)

  const { data, error } = await fetchUser(id)
  if (error || !data) throw new Error(error?.message ?? 'User not found')

  return data
}

export const updateUser = async (id: string, values: TableUpdate<'users'>, previousEmail?: string) => {
  const currentUser = await getCurrentUser()
  if (currentUser.id !== id && !currentUser.isAdmin) throw new Error('Forbidden')

  const [updated] = await db.update(users).set(values).where(eq(users.id, id)).returning()
  if (!updated) throw new Error('Failed to update user')

  const parsed = await queryUserById(id)

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

  if (adminMemberships.length > 0) {
    const adminOrgIds = adminMemberships.map(m => m.organizationId)
    const orgsWithOtherAdmin = await db
      .selectDistinct({ organizationId: memberships.organizationId })
      .from(memberships)
      .where(
        and(
          inArray(memberships.organizationId, adminOrgIds),
          eq(memberships.role, 'admin'),
          ne(memberships.userId, user.id)
        )
      )
    const covered = new Set(orgsWithOtherAdmin.map(m => m.organizationId))
    if (adminOrgIds.some(orgId => !covered.has(orgId))) throw new Error('SOLE_ORG_ADMIN')
  }

  const cert = await db.query.certificates.findFirst({
    where: eq(certificates.userId, user.id),
    columns: { id: true },
  })
  if (cert) throw new Error('HAS_CERTIFICATES')

  await transaction(tx => deleteUser(tx, user.id))

  redirect(AUTH_ROOT)
}
