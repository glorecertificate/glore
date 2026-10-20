'use server'

import 'server-only'

import { revalidateTag } from 'next/cache'

import { eq } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { db } from '@/db/client'
import { parseUser, userWith } from '@/db/queries/user'
import { users } from '@/db/schema'
import { userTag } from '@/lib/cache'
import { r2DeleteQuietly, r2PresignAvatar, r2VerifyAvatar } from '@/lib/storage'

export const createAvatarUploadUrl = async (contentType: string, size: number) => {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  return await r2PresignAvatar(`avatars/${user.id}`, contentType, size)
}

export const confirmAvatar = async (key: string) => {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')
  if (!key.startsWith(`avatars/${user.id}-`)) throw new Error('Invalid key')

  const avatarUrl = await r2VerifyAvatar(key)
  const current = await db.query.users.findFirst({ columns: { avatarUrl: true }, where: eq(users.id, user.id) })

  await db.update(users).set({ avatarUrl }).where(eq(users.id, user.id))
  if (current?.avatarUrl && current.avatarUrl !== avatarUrl) await r2DeleteQuietly(current.avatarUrl)
  revalidateTag(userTag(user.id), 'max')

  const updated = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    with: userWith,
  })
  if (!updated) return { error: { code: 'NOT_FOUND', message: 'User not found' } }

  return { data: parseUser(updated) }
}

export const removeAvatar = async () => {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const current = await db.query.users.findFirst({
    columns: { avatarUrl: true },
    where: eq(users.id, user.id),
  })
  await db.update(users).set({ avatarUrl: null }).where(eq(users.id, user.id))
  if (current?.avatarUrl) await r2DeleteQuietly(current.avatarUrl)
  revalidateTag(userTag(user.id), 'max')

  const updated = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    with: userWith,
  })
  if (!updated) return { data: null, error: { code: 'NOT_FOUND', message: 'User not found' } }

  return { data: parseUser(updated), error: null }
}
