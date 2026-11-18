import 'server-only'

import { cacheTag } from 'next/cache'

import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { parseUser, userWith } from '@/db/queries/user'
import { users } from '@/db/schema'
import { userTag } from '@/lib/cache'

export const USER_NOT_FOUND = 'User not found'

export const queryUserById = async (id: string) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: userWith,
  })
  if (!user) throw new Error(USER_NOT_FOUND)
  return parseUser(user)
}

export const fetchUser = async (id: string) => {
  'use cache'
  cacheTag(userTag(id))

  return await safeQuery(() => queryUserById(id))
}

export const findUser = async (id: string, { cache: useCache = true }: { cache?: boolean } = {}) => {
  if (!useCache) return await queryUserById(id)

  const { data, error } = await fetchUser(id)
  if (error || !data) throw new Error(error?.message ?? USER_NOT_FOUND)

  return data
}
