import 'server-only'

import { unstable_cache } from 'next/cache'
import { type NextRequest } from 'next/server'

import { getProxyDatabase } from '@/db/client'
import { CacheTag } from '@/lib/cache'

export const verifyAuthUser = unstable_cache(
  async (request: NextRequest) => {
    const db = await getProxyDatabase(request)
    const { error } = await db.auth.getUser()
    if (error) throw error
    return true
  },
  [CacheTag.AuthUser],
  {
    revalidate: 3600,
    tags: [CacheTag.AuthUser],
  }
)
