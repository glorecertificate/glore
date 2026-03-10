'use server'

import 'server-only'

import { del, put } from '@vercel/blob'
import { eq } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { db } from '@/db/client'
import { parseUser } from '@/db/queries/user'
import { users } from '@/db/schema'

const userWith = {
  memberships: { with: { organization: true } },
  regions: { columns: { id: true, name: true, icon: true } },
} as const

export const uploadAvatar = async (formData: FormData) => {
  const file = formData.get('file') as File
  if (!file) throw new Error('No file uploaded')

  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')

  const blob = await put(`avatars/${user.id}-${Date.now()}.png`, file, {
    access: 'public',
    contentType: 'image/png',
  })

  await db.update(users).set({ avatarUrl: blob.url }).where(eq(users.id, user.id))

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

  // Get current avatar URL to delete from blob storage
  const current = await db.query.users.findFirst({
    columns: { avatarUrl: true },
    where: eq(users.id, user.id),
  })
  if (current?.avatarUrl) {
    await del(current.avatarUrl).catch(console.error)
  }

  await db.update(users).set({ avatarUrl: null }).where(eq(users.id, user.id))

  const updated = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    with: userWith,
  })
  if (!updated) return { data: null, error: { code: 'NOT_FOUND', message: 'User not found' } }

  return { data: parseUser(updated), error: null }
}
