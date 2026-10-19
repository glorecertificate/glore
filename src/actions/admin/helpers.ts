import 'server-only'

import { revalidateTag, updateTag } from 'next/cache'

import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { sessions } from '@/db/schema'
import { CacheTag, userTag } from '@/lib/cache'

export const revalidateUserAccess = (userId: string) => {
  updateTag(userTag(userId))
  revalidateTag(CacheTag.AdminUsers, 'max')
  revalidateTag(CacheTag.TeamMembers, 'max')
}

export const revokeUserSessions = async (userId: string) => {
  await db.delete(sessions).where(eq(sessions.userId, userId))
}
