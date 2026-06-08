'use server'

import 'server-only'

import { cacheTag } from 'next/cache'

import { eq } from 'drizzle-orm'

import { getCurrentUser } from '@/actions/user'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { parseUser, userWith } from '@/db/queries/user'
import { users } from '@/db/schema'
import { CacheTag } from '@/lib/cache'

const queryAdminUsers = async () => {
  const result = await db.query.users.findMany({
    orderBy: (u, { desc: orderDesc }) => [orderDesc(u.createdAt)],
    with: userWith,
    limit: 1000,
  })
  return result.map(parseUser)
}

const fetchAdminUsers = async () => {
  'use cache'
  cacheTag(CacheTag.AdminUsers)

  return await safeQuery(queryAdminUsers)
}

export const getAdminUsers = async ({ cache = true }: { cache?: boolean } = {}) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { data: null, error: 'Forbidden' }

  if (!cache) return { data: await queryAdminUsers(), error: null }
  return await fetchAdminUsers()
}

export const banUser = async (userId: string, reason?: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can ban users' }
  if (currentUser.id === userId) return { error: 'You cannot ban yourself' }

  await db
    .update(users)
    .set({ banned: true, banReason: reason?.trim() || null })
    .where(eq(users.id, userId))

  return { data: { id: userId } }
}

export const unbanUser = async (userId: string) => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can unban users' }

  await db.update(users).set({ banned: false, banReason: null, banExpires: null }).where(eq(users.id, userId))

  return { data: { id: userId } }
}

export const updateUserRole = async (userId: string, role: 'admin' | 'editor' | 'user') => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { error: 'Only admins can update user roles' }
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
