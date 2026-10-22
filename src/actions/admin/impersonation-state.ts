import 'server-only'

import { headers } from 'next/headers'
import { cache } from 'react'

import { auth } from '@/lib/auth'

const ADMIN_COOKIE = 'admin_session'

export const getImpersonation = cache(async () => {
  const [{ createAuthCookie }, requestHeaders] = await Promise.all([auth.$context, headers()])
  const cookieHeader = requestHeaders.get('cookie') ?? ''
  if (!cookieHeader.includes(createAuthCookie(ADMIN_COOKIE).name)) return null
  return await auth.api.getImpersonation({ headers: requestHeaders })
})

export const isImpersonating = async () => (await getImpersonation()) !== null
