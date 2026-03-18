'use server'

import 'server-only'

import { cacheTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import { eq, or } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { getCookie } from '@/actions/cookies'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { parseUser, userWith } from '@/db/queries/user'
import { users } from '@/db/schema'
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
