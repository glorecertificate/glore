import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { cache } from 'react'

import { asc } from 'drizzle-orm'

import { queryAdminAudit } from '@/actions/admin/audit-core'
import { queryAdminCertificates } from '@/actions/admin/certificates-core'
import { adminAction } from '@/actions/admin/helpers'
import { loadOrganizations } from '@/actions/admin/organizations-core'
import { queryTeamMembers } from '@/actions/admin/team-core'
import { queryAdminUsers } from '@/actions/admin/users-core'
import { getViewer } from '@/actions/viewer'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { adminError } from '@/db/mutations/moderation'
import { type AdminAuditQuery } from '@/db/queries/admin-audit'
import { type AdminCertificatesQuery } from '@/db/queries/admin-certificate'
import { type AdminUsersQuery } from '@/db/queries/admin-user'
import { organizations } from '@/db/schema'
import { CacheTag } from '@/lib/cache'
import { loadSettings } from '@/lib/settings'

const LIST_LIFE = { stale: 60, revalidate: 300, expire: 3600 } as const

const requireAdminView = cache(async () => {
  const user = await getViewer()
  if (!user.isAdmin) throw adminError('FORBIDDEN')
  return user
})

const readOrganizationOptions = async () => {
  'use cache'
  cacheTag(CacheTag.Organizations)
  cacheLife(LIST_LIFE)

  return await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .orderBy(asc(organizations.name))
    .limit(1000)
}

const readUsers = async (input: AdminUsersQuery) => {
  'use cache'
  cacheTag(CacheTag.AdminUsers, CacheTag.Organizations)
  cacheLife(LIST_LIFE)

  return await queryAdminUsers(input)
}

const readCertificates = async (input: AdminCertificatesQuery) => {
  'use cache'
  cacheTag(CacheTag.AdminOverview, CacheTag.AdminUsers, CacheTag.Organizations)
  cacheLife(LIST_LIFE)

  return await queryAdminCertificates(input)
}

const readAudit = async (input: AdminAuditQuery) => {
  'use cache'
  cacheTag(CacheTag.AdminOverview, CacheTag.AdminUsers, CacheTag.Organizations)
  cacheLife(LIST_LIFE)

  return await queryAdminAudit(input)
}

export const loadAdminOrganizationOptions = async () =>
  await adminAction(async () => {
    await requireAdminView()
    return await readOrganizationOptions()
  })

export const loadAdminUsers = async (input: AdminUsersQuery) =>
  await adminAction(async () => {
    await requireAdminView()
    return await readUsers(input)
  })

export const loadAdminCertificates = async (input: AdminCertificatesQuery) =>
  await adminAction(async () => {
    await requireAdminView()
    return await readCertificates(input)
  })

export const loadAdminAudit = async (input: AdminAuditQuery) =>
  await adminAction(async () => {
    await requireAdminView()
    return await readAudit(input)
  })

const readTeam = async () => {
  'use cache'
  cacheTag(CacheTag.TeamMembers)
  cacheLife(LIST_LIFE)

  return await safeQuery(queryTeamMembers)
}

const readOrganizations = async () => {
  'use cache'
  cacheTag(CacheTag.Organizations)
  cacheLife(LIST_LIFE)

  return await loadOrganizations()
}

export const loadAdminTeam = async () => {
  const admin = await adminAction(requireAdminView)
  if (admin.error) return { data: null, error: admin.error }
  return await readTeam()
}

export const loadAdminOrganizations = async () => {
  const admin = await adminAction(requireAdminView)
  if (admin.error) return { data: null, error: admin.error }
  return await readOrganizations()
}

export const loadAdminSettings = async () =>
  await adminAction(async () => {
    await requireAdminView()
    return await loadSettings()
  })
