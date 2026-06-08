'use server'

import 'server-only'

import { eq } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { db } from '@/db/client'
import { parseUser, userWith } from '@/db/queries/user'
import { users } from '@/db/schema'
import { r2Delete, r2Put } from '@/lib/storage'

const MAX_AVATAR_SIZE = 5 * 1024 * 1024

const validateImageFile = async (file: File) => {
  if (file.size > MAX_AVATAR_SIZE) throw new Error('File too large (max 5 MB)')

  const IMAGE_SIGNATURES: [string, number[]][] = [
    ['image/png', [0x89, 0x50, 0x4e, 0x47]],
    ['image/jpeg', [0xff, 0xd8, 0xff]],
    ['image/webp', [0x52, 0x49, 0x46, 0x46]],
  ]

  const buffer = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  const match = IMAGE_SIGNATURES.find(([, sig]) => {
    if (sig.length > buffer.length) return false
    // eslint-disable-next-line react-doctor/js-length-check-first
    return sig.every((byte, i) => buffer[i] === byte)
  })
  if (!match) throw new Error('Invalid image file')

  return match[0]
}

export const uploadAvatar = async (formData: FormData) => {
  const file = formData.get('file') as File
  if (!file) throw new Error('No file uploaded')

  const [user, mimeType] = await Promise.all([getAuthUser(), validateImageFile(file)])
  if (!user) throw new Error('Unauthorized')
  const ext = mimeType.split('/')[1]
  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await r2Put(`avatars/${user.id}-${Date.now()}.${ext}`, buffer, mimeType)

  await db.update(users).set({ avatarUrl: url }).where(eq(users.id, user.id))

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
