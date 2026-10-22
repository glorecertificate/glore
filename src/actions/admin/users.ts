'use server'

import 'server-only'

import { type SQL, and, asc, count, desc, eq, exists, gt, ilike, inArray, isNull, or, sql } from 'drizzle-orm'

import { adminAction, requireAdmin, requireAdminWithLimit, revalidateUserAccess } from '@/actions/admin/helpers'
import { notify } from '@/actions/notifications/notify'
import { db, transaction } from '@/db/client'
import { adminError, reinstateAccount, setPlatformRole, suspendAccount } from '@/db/mutations/moderation'
import {
  ADMIN_USERS_PAGE_SIZE,
  type AdminUserRow,
  type AdminUsersQuery,
  type BanInput,
  adminUsersQuerySchema,
  banInputSchema,
  likePattern,
  platformRoleOf,
  roleInputSchema,
  searchTokens,
  toPage,
} from '@/db/queries/admin-user'
import { memberships, organizations, users } from '@/db/schema'

type ParsedQuery = ReturnType<typeof adminUsersQuerySchema.parse>

const NOW_UTC = sql`(now() at time zone 'utc')`

const activeBan = and(eq(users.banned, true), or(isNull(users.banExpires), gt(users.banExpires, NOW_UTC)))

const buildFilters = (query: ParsedQuery) => {
  const conditions: (SQL | undefined)[] = searchTokens(query.q).map(token => {
    const pattern = likePattern(token)
    return or(
      ilike(users.firstName, pattern),
      ilike(users.lastName, pattern),
      ilike(users.email, pattern),
      ilike(users.username, pattern)
    )
  })

  if (query.role === 'admin') conditions.push(eq(users.role, 'admin'))
  if (query.role === 'editor' || query.role === 'user') {
    conditions.push(and(sql`coalesce(${users.role}, 'user') <> 'admin'`, eq(users.isEditor, query.role === 'editor')))
  }
  if (query.status === 'active') conditions.push(sql`${users.onboardedAt} is not null`)
  if (query.status === 'pending') conditions.push(isNull(users.onboardedAt))
  if (query.banned === 'yes') conditions.push(activeBan)
  if (query.banned === 'no') conditions.push(sql`not coalesce(${activeBan}, false)`)
  if (query.organizationId) {
    conditions.push(
      exists(
        db
          .select({ id: memberships.id })
          .from(memberships)
          .where(and(eq(memberships.userId, users.id), eq(memberships.organizationId, query.organizationId)))
      )
    )
  }

  return and(...conditions)
}

const loadOrganizations = async (userIds: string[]) => {
  if (userIds.length === 0) return new Map<string, AdminUserRow['organizations']>()
  const rows = await db
    .select({ id: organizations.id, name: organizations.name, role: memberships.role, userId: memberships.userId })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
    .where(inArray(memberships.userId, userIds))
    .orderBy(asc(organizations.name))

  return rows.reduce((map, { userId, ...organization }) => {
    map.set(userId, [...(map.get(userId) ?? []), organization])
    return map
  }, new Map<string, AdminUserRow['organizations']>())
}

export const listAdminUsers = async (input: AdminUsersQuery) =>
  await adminAction(async () => {
    await requireAdmin()
    const parsed = adminUsersQuerySchema.safeParse(input)
    if (!parsed.success) throw adminError('INVALID_INPUT')

    const where = buildFilters(parsed.data)
    const [totals] = await db.select({ total: count() }).from(users).where(where)
    const total = totals?.total ?? 0
    const pageCount = Math.max(1, Math.ceil(total / ADMIN_USERS_PAGE_SIZE))
    const page = Math.min(parsed.data.page ?? 1, pageCount)

    const records = await db
      .select({
        avatarUrl: users.avatarUrl,
        banExpires: users.banExpires,
        banReason: users.banReason,
        banned: users.banned,
        createdAt: users.createdAt,
        email: users.email,
        firstName: users.firstName,
        id: users.id,
        isEditor: users.isEditor,
        lastName: users.lastName,
        onboardedAt: users.onboardedAt,
        role: users.role,
        username: users.username,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt), desc(users.id))
      .limit(ADMIN_USERS_PAGE_SIZE)
      .offset((page - 1) * ADMIN_USERS_PAGE_SIZE)

    const byUser = await loadOrganizations(records.map(({ id }) => id))
    const rows: AdminUserRow[] = records.map(({ isEditor, role, ...record }) => ({
      ...record,
      banned: record.banned ?? false,
      organizations: byUser.get(record.id) ?? [],
      platformRole: platformRoleOf({ isEditor, role }),
    }))

    return toPage(rows, { page, pageSize: ADMIN_USERS_PAGE_SIZE, total })
  })

export const banUser = async (input: BanInput) =>
  await adminAction(async () => {
    const actor = await requireAdminWithLimit('ban', 60)
    const parsed = banInputSchema.safeParse(input)
    if (!parsed.success) throw adminError('INVALID_INPUT')
    const { expiresAt, reason, userId } = parsed.data

    const { event } = await transaction(tx =>
      suspendAccount(tx, {
        actorId: actor.id,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        reason,
        userId,
      })
    )
    revalidateUserAccess(userId)
    await notify(event)
    return { id: userId }
  })

export const unbanUser = async (userId: string) =>
  await adminAction(async () => {
    if (!userId || typeof userId !== 'string') throw adminError('INVALID_INPUT')
    const actor = await requireAdminWithLimit('ban', 60)

    const { event } = await transaction(tx => reinstateAccount(tx, { actorId: actor.id, userId }))
    revalidateUserAccess(userId)
    await notify(event)
    return { id: userId }
  })

export const updateUserRole = async (userId: string, role: string) =>
  await adminAction(async () => {
    const actor = await requireAdminWithLimit('role', 60)
    const parsed = roleInputSchema.safeParse({ role, userId })
    if (!parsed.success) throw adminError('INVALID_INPUT')

    const result = await transaction(tx =>
      setPlatformRole(tx, { actorId: actor.id, role: parsed.data.role, userId: parsed.data.userId })
    )
    revalidateUserAccess(parsed.data.userId)
    await notify(result.event)
    return { id: parsed.data.userId, role: result.role }
  })
