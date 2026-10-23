'use server'

import 'server-only'

import { type SQL, and, desc, eq, ilike, isNull, ne, or, sql } from 'drizzle-orm'

import {
  type CertificateScope,
  SEARCH_LIMIT,
  certificateScopes,
  likePattern,
  memberScope,
  normalizeQuery,
} from '@/actions/shell/scope'
import { getActiveOrgId, getCurrentUser } from '@/actions/user'
import { db } from '@/db/client'
import { queryError } from '@/db/helpers'
import { certificates, memberships, organizations, users } from '@/db/schema'
import { fullName } from '@/lib/utils'

export interface CertificateHit {
  code: string | null
  handle: string
  holderName: string
  id: number
  isOwn: boolean
  organizationName: string
  status: (typeof certificates.$inferSelect)['status']
}

export interface MemberHit {
  email: string
  id: number
  name: string
  role: (typeof memberships.$inferSelect)['role']
}

export interface WorkspaceSearchResult {
  certificates: CertificateHit[]
  members: MemberHit[]
}

const scopeCondition = (scope: CertificateScope) => {
  if (scope.kind === 'own') return eq(certificates.userId, scope.userId)
  if (scope.kind === 'organization') {
    return and(eq(certificates.organizationId, scope.organizationId), ne(certificates.status, 'draft'))
  }
  return and(
    eq(certificates.organizationId, scope.organizationId),
    ne(certificates.status, 'draft'),
    or(
      eq(certificates.reviewerId, scope.userId),
      and(isNull(certificates.reviewerId), eq(certificates.status, 'submitted'))
    )
  )
}

const holderName = sql`concat_ws(' ', ${users.firstName}, ${users.lastName})`

const searchCertificates = async (query: string, scopes: CertificateScope[], viewerId: string) => {
  if (scopes.length === 0) return []
  const pattern = likePattern(query)
  const compact = query.replace(/-/gu, '')
  const matches: (SQL | undefined)[] = [
    ilike(certificates.handle, pattern),
    ilike(certificates.code, pattern),
    ilike(organizations.name, pattern),
    sql`${holderName} ilike ${pattern}`,
    ilike(users.username, pattern),
  ]
  if (compact.length >= 2) matches.push(sql`replace(${certificates.code}, '-', '') ilike ${likePattern(compact)}`)

  const rows = await db
    .select({
      code: certificates.code,
      firstName: users.firstName,
      handle: certificates.handle,
      id: certificates.id,
      lastName: users.lastName,
      organizationName: organizations.name,
      status: certificates.status,
      userId: certificates.userId,
    })
    .from(certificates)
    .innerJoin(users, eq(users.id, certificates.userId))
    .innerJoin(organizations, eq(organizations.id, certificates.organizationId))
    .where(and(or(...scopes.map(scopeCondition)), isNull(certificates.holderDeletedAt), or(...matches)))
    .orderBy(desc(certificates.updatedAt))
    .limit(SEARCH_LIMIT)

  return rows.map(({ firstName, lastName, userId, ...row }): CertificateHit => ({
    ...row,
    holderName: fullName({ firstName, lastName }),
    isOwn: userId === viewerId,
  }))
}

const searchMembers = async (query: string, organizationId: number) => {
  const pattern = likePattern(query)
  const rows = await db
    .select({
      email: users.email,
      firstName: users.firstName,
      id: memberships.id,
      lastName: users.lastName,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(
      and(
        eq(memberships.organizationId, organizationId),
        or(sql`${holderName} ilike ${pattern}`, ilike(users.email, pattern), ilike(users.username, pattern))
      )
    )
    .orderBy(users.firstName, users.lastName)
    .limit(SEARCH_LIMIT)

  return rows.map(({ firstName, lastName, ...row }): MemberHit => ({ ...row, name: fullName({ firstName, lastName }) }))
}

export const searchWorkspace = async (input: string) => {
  try {
    const query = normalizeQuery(typeof input === 'string' ? input : '')
    if (!query) return { data: { certificates: [], members: [] } satisfies WorkspaceSearchResult, error: null }

    const [user, organizationId] = await Promise.all([getCurrentUser(), getActiveOrgId()])
    const viewer = {
      canEdit: user.isAdmin || Boolean(user.isEditor),
      id: user.id,
      organizationId,
      role: user.organizations.find(({ id }) => id === organizationId)?.role ?? null,
    }
    const members = memberScope(viewer)

    const [certificateHits, memberHits] = await Promise.all([
      searchCertificates(query, certificateScopes(viewer), user.id),
      members ? searchMembers(query, members.organizationId) : [],
    ])

    return { data: { certificates: certificateHits, members: memberHits }, error: null }
  } catch (error) {
    return { data: null, error: queryError(error) }
  }
}
