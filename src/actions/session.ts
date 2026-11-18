import 'server-only'

import { cacheLife } from 'next/cache'
import { headers } from 'next/headers'

import { auth } from '@/lib/auth'

export const getSessionUser = async () => {
  'use cache: private'
  cacheLife({ stale: 30, revalidate: 60, expire: 600 })

  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true, disableRefresh: true },
  })
  return session?.user ?? null
}
