import 'server-only'

import { revalidateTag, updateTag } from 'next/cache'
import { headers } from 'next/headers'
import { unstable_rethrow } from 'next/navigation'

import { APIError } from 'better-auth/api'

import { expireTeam } from '@/actions/admin/expire'
import { queryError } from '@/db/helpers'
import { adminError, isAdminError } from '@/db/mutations/moderation'
import { auth } from '@/lib/auth'
import { CacheTag, userTag } from '@/lib/cache'
import { checkRateLimit } from '@/lib/rate-limit'

const HOUR = 60 * 60 * 1000

export const revalidateUserAccess = (userId: string) => {
  updateTag(userTag(userId))
  revalidateTag(CacheTag.AdminUsers, 'max')
  expireTeam()
}

export const requireAdmin = async () => {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } })
  const user = session?.user
  if (!user) throw adminError('UNAUTHORIZED')
  if (user.role !== 'admin' || user.banned) throw adminError('FORBIDDEN')
  return user
}

export const requireAdminWithLimit = async (action: string, max: number) => {
  const user = await requireAdmin()
  const { limited } = await checkRateLimit(`admin:${action}:${user.id}`, max, HOUR)
  if (limited) throw adminError('RATE_LIMITED')
  return user
}

export const adminAction = async <T>(work: () => Promise<T>) => {
  try {
    return { data: await work(), error: null }
  } catch (error) {
    unstable_rethrow(error)
    if (isAdminError(error)) return { data: null, error: { code: error.code, message: error.message } }
    if (error instanceof APIError) {
      return { data: null, error: { code: String(error.body?.code ?? error.status), message: error.message } }
    }
    return { data: null, error: queryError(error) }
  }
}
