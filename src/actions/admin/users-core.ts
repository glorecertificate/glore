import 'server-only'

import { type SQL, and, asc, count, desc, eq, exists, gt, ilike, inArray, isNull, or, sql } from 'drizzle-orm'

import { db } from '@/db/client'
import { adminError } from '@/db/mutations/moderation'
import {
  ADMIN_USERS_PAGE_SIZE,
  type AdminUserRow,
  type AdminUsersQuery,
  type FacetCounts,
  adminUsersQuerySchema,
  likePattern,
  platformRoleOf,
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

const FACET_EXPRESSIONS = {
  banned: sql<string>`case when coalesce(${activeBan}, false) then 'yes' else 'no' end`,
  role: sql<string>`case when ${users.role} = 'admin' then 'admin' when ${users.isEditor} then 'editor' else 'user' end`,
  status: sql<string>`case when ${users.onboardedAt} is not null then 'active' else 'pending' end`,
} as const

const countFacets = async (query: ParsedQuery): Promise<FacetCounts> => {
  const entries = await Promise.all(
    (Object.keys(FACET_EXPRESSIONS) as (keyof typeof FACET_EXPRESSIONS)[]).map(async key => {
      const expression = FACET_EXPRESSIONS[key]
      const rows = await db
        .select({ key: expression, total: count() })
        .from(users)
        .where(buildFilters({ ...query, [key]: null }))
        .groupBy(sql`1`)
      return [key, Object.fromEntries(rows.map(row => [row.key, row.total]))] as const
    })
  )
  return Object.fromEntries(entries)
}

export const queryAdminUsers = async (input: AdminUsersQuery) => {
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

  return { ...toPage(rows, { page, pageSize: ADMIN_USERS_PAGE_SIZE, total }), facets: await countFacets(parsed.data) }
}
