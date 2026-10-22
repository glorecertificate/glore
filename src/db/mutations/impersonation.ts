import 'server-only'

import { APIError } from 'better-auth/api'
import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import { type ImpersonationErrorCode, isBanActive } from '@/db/queries/admin-user'
import { users } from '@/db/schema/users'

const IMPERSONATION_MESSAGES = {
  ALREADY_IMPERSONATING: 'Stop the current impersonation first',
  CANNOT_IMPERSONATE_ADMINS: 'Platform admins cannot be impersonated',
  CANNOT_IMPERSONATE_SELF: 'You cannot impersonate yourself',
  FORBIDDEN: 'Only platform admins can impersonate users',
  NOT_ALLOWED_WHILE_IMPERSONATING: 'This action is not available while viewing as another user',
  NOT_IMPERSONATING: 'You are not impersonating anyone',
  NOT_ONBOARDED: 'This user has not finished onboarding',
  TARGET_BANNED: 'Banned users cannot be impersonated',
  USER_NOT_FOUND: 'User not found',
} satisfies Record<ImpersonationErrorCode, string>

export const impersonationError = (status: 'BAD_REQUEST' | 'FORBIDDEN' | 'NOT_FOUND', code: ImpersonationErrorCode) =>
  APIError.from(status, { code, message: IMPERSONATION_MESSAGES[code] })

export const assertCanImpersonate = async ({ adminId, userId }: { adminId: string; userId: string }) => {
  const [target] = await db
    .select({
      banExpires: users.banExpires,
      banned: users.banned,
      id: users.id,
      onboardedAt: users.onboardedAt,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
  if (!target) throw impersonationError('NOT_FOUND', 'USER_NOT_FOUND')
  if (target.id === adminId) throw impersonationError('BAD_REQUEST', 'CANNOT_IMPERSONATE_SELF')
  if (target.role === 'admin') throw impersonationError('FORBIDDEN', 'CANNOT_IMPERSONATE_ADMINS')
  if (isBanActive(target)) throw impersonationError('FORBIDDEN', 'TARGET_BANNED')
  if (!target.onboardedAt) throw impersonationError('BAD_REQUEST', 'NOT_ONBOARDED')
}
