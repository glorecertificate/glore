'use server'

import 'server-only'

import { cacheTag } from 'next/cache'

import { asc } from 'drizzle-orm'

import { adminAction, requireAdmin } from '@/actions/admin/helpers'
import { db } from '@/db/client'
import { organizations } from '@/db/schema'
import { CacheTag } from '@/lib/cache'

const fetchOrganizationOptions = async () => {
  'use cache'
  cacheTag(CacheTag.Organizations)

  return await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .orderBy(asc(organizations.name))
    .limit(1000)
}

export const listAdminOrganizationOptions = async () =>
  await adminAction(async () => {
    await requireAdmin()
    return await fetchOrganizationOptions()
  })
