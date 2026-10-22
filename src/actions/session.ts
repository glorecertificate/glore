import 'server-only'

import { cacheLife } from 'next/cache'
import { headers } from 'next/headers'

import { auth } from '@/lib/auth'

export const getSessionUser = async () => {
  'use cache: private'
  cacheLife({ stale: 300 })

  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}
