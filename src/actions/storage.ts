'use server'

import 'server-only'

import { eq } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { db } from '@/db/client'
import { parseUser, userWith } from '@/db/queries/user'
import { users } from '@/db/schema'
import { AVATAR_CONTENT_TYPES } from '@/lib/constants'
import { r2Delete, r2PresignPut, r2Url } from '@/lib/storage'

export const createAvatarUploadUrl = async (contentType: string) => {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')
  if (!AVATAR_CONTENT_TYPES.includes(contentType)) throw new Error('Invalid image type')

  const ext = contentType.split('/')[1]
  const key = `avatars/${user.id}-${Date.now()}.${ext}`
  const url = await r2PresignPut(key, contentType)

  return { key, url }
}

export const confirmAvatar = async (key: string) => {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')
  if (!key.startsWith(`avatars/${user.id}-`)) throw new Error('Invalid key')

  await db
    .update(users)
    .set({ avatarUrl: r2Url(key) })
    .where(eq(users.id, user.id))

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
  if (current?.avatarUrl) {
    await r2Delete(current.avatarUrl).catch(console.error)
  }

  await db.update(users).set({ avatarUrl: null }).where(eq(users.id, user.id))

  const updated = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    with: userWith,
  })
  if (!updated) return { data: null, error: { code: 'NOT_FOUND', message: 'User not found' } }

  return { data: parseUser(updated), error: null }
}
