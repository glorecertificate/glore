import 'server-only'

import { cacheLife } from 'next/cache'
import { headers } from 'next/headers'
import { unstable_rethrow } from 'next/navigation'

import { auth } from '@/lib/auth'

export const getSessionUser = async () => {
  'use cache: private'
  cacheLife({ stale: 300 })

  try {
    const session = await auth.api.getSession({ headers: await headers() })
    return session?.user ?? null
  } catch (e) {
    unstable_rethrow(e)
    return null
  }
}
