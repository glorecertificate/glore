'use server'

import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import { cache } from 'react'

import { asc } from 'drizzle-orm'

import { getAuthUser } from '@/actions/auth'
import { fetchCourses, queryCatalog } from '@/actions/courses/helpers'
import { db } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { skillGroups } from '@/db/schema'
import { CacheTag } from '@/lib/cache'

export const listCourses = async ({ cache: useCache = true }: { cache?: boolean } = {}) => {
  const authUser = await getAuthUser()
  const isEditor = authUser?.role === 'admin' || authUser?.isEditor
  const userId = isEditor ? undefined : authUser?.id
  if (!useCache) return await safeQuery(() => queryCatalog(userId))
  return await fetchCourses(userId)
}

export const listSkillGroups = cache(async () => {
  'use cache'
  cacheTag(CacheTag.SkillGroups)
  cacheLife('max')

  return await db.query.skillGroups.findMany({
    columns: { id: true, name: true, slug: true },
    orderBy: [asc(skillGroups.sortOrder), asc(skillGroups.id)],
    limit: 100,
  })
})
