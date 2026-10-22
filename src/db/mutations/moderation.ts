import 'server-only'

import { count, eq, sql } from 'drizzle-orm'

import { type Transaction } from '@/db/client'
import { recordEvent } from '@/db/mutations/activity-event'
import { type AppEvent } from '@/db/queries/activity-event'
import { type AdminErrorCode, type PlatformRole, platformRoleOf } from '@/db/queries/admin-user'
import { sessions, users } from '@/db/schema'

const ADMIN_ERROR_MESSAGES = {
  EMAIL_TAKEN: 'An account with this email already exists',
  FORBIDDEN: 'Only platform admins can do this',
  INVALID_INPUT: 'These values are not valid',
  LAST_ADMIN: 'The platform needs at least one admin',
  NO_CHANGE: 'This user already has that role',
  NOT_BANNED: 'This user is not banned',
  NOT_FOUND: 'User not found',
  RATE_LIMITED: 'Too many attempts. Try again later.',
  SELF: 'You cannot do this to your own account',
  SEND_FAILED: 'The email could not be sent',
  TARGET_IS_ADMIN: 'Platform admins cannot be banned. Remove the admin role first.',
  TOO_SOON: 'The invitation was sent a moment ago',
  UNAUTHORIZED: 'Not authenticated',
} satisfies Record<AdminErrorCode, string>

export const adminError = (code: AdminErrorCode) => Object.assign(new Error(ADMIN_ERROR_MESSAGES[code]), { code })

export const isAdminError = (error: unknown): error is Error & { code: AdminErrorCode } =>
  error instanceof Error && 'code' in error && typeof error.code === 'string' && error.code in ADMIN_ERROR_MESSAGES

const findTarget = async (tx: Transaction, userId: string) => {
  const [target] = await tx
    .select({
      banExpires: users.banExpires,
      banned: users.banned,
      isEditor: users.isEditor,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .for('update')
  if (!target) throw adminError('NOT_FOUND')
  return target
}

export const suspendAccount = async (
  tx: Transaction,
  { actorId, expiresAt, reason, userId }: { actorId: string; expiresAt: string | null; reason: string; userId: string }
) => {
  if (actorId === userId) throw adminError('SELF')
  const target = await findTarget(tx, userId)
  if (target.role === 'admin') throw adminError('TARGET_IS_ADMIN')

  await tx.update(users).set({ banExpires: expiresAt, banReason: reason, banned: true }).where(eq(users.id, userId))
  await tx.delete(sessions).where(eq(sessions.userId, userId))

  const event: AppEvent<'account.suspended'> = {
    actorId,
    data: { expiresAt, reason, userId },
    organizationId: null,
    type: 'account.suspended',
  }
  await recordEvent(tx, event)
  return { event, userId }
}

export const reinstateAccount = async (tx: Transaction, { actorId, userId }: { actorId: string; userId: string }) => {
  const target = await findTarget(tx, userId)
  if (!(target.banned || target.banExpires)) throw adminError('NOT_BANNED')

  await tx.update(users).set({ banExpires: null, banReason: null, banned: false }).where(eq(users.id, userId))

  const event: AppEvent<'account.reinstated'> = {
    actorId,
    data: { userId },
    organizationId: null,
    type: 'account.reinstated',
  }
  await recordEvent(tx, event)
  return { event, userId }
}

const ROLE_FIELDS = {
  admin: { isEditor: false, role: 'admin' },
  editor: { isEditor: true, role: 'user' },
  user: { isEditor: false, role: 'user' },
} as const satisfies Record<PlatformRole, { isEditor: boolean; role: string }>

export const setPlatformRole = async (
  tx: Transaction,
  { actorId, role, userId }: { actorId: string; role: PlatformRole; userId: string }
) => {
  if (actorId === userId) throw adminError('SELF')
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('platform-admins', 0))`)

  const target = await findTarget(tx, userId)
  const previousRole = platformRoleOf(target)
  if (previousRole === role) throw adminError('NO_CHANGE')

  await tx.update(users).set(ROLE_FIELDS[role]).where(eq(users.id, userId))

  if (previousRole === 'admin') {
    const [admins] = await tx.select({ total: count() }).from(users).where(eq(users.role, 'admin'))
    if (!admins?.total) throw adminError('LAST_ADMIN')
  }

  const event: AppEvent<'team.role_changed'> = {
    actorId,
    data: { role: role === 'user' ? null : role, userId },
    organizationId: null,
    type: 'team.role_changed',
  }
  await recordEvent(tx, event)
  return { event, previousRole, role, userId }
}
