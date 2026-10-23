import 'server-only'

import { updateTag } from 'next/cache'
import { unstable_rethrow } from 'next/navigation'

import { requireAdmin } from '@/actions/admin/helpers'
import { assertNotImpersonating } from '@/actions/admin/impersonation-state'
import { requireEditor } from '@/actions/guards'
import { queryError } from '@/db/helpers'
import { isLegalError, legalError } from '@/db/mutations/legal'
import { isAdminError } from '@/db/mutations/moderation'
import { legalTag } from '@/lib/cache'
import { checkRateLimit } from '@/lib/rate-limit'

const HOUR = 60 * 60 * 1000

const limited = async (action: string, userId: string, max: number) => {
  const { limited: exceeded } = await checkRateLimit(`legal:${action}:${userId}`, max, HOUR)
  if (exceeded) throw legalError('RATE_LIMITED')
}

export const requireLegalEditor = async (action: string, max: number) => {
  await assertNotImpersonating()
  const user = await requireEditor().catch((error: unknown) => {
    throw legalError(error instanceof Error && error.message === 'Not authenticated' ? 'UNAUTHORIZED' : 'FORBIDDEN')
  })
  await limited(action, user.id, max)
  return user
}

export const requireLegalAdmin = async (action: string, max: number) => {
  await assertNotImpersonating()
  const user = await requireAdmin().catch((error: unknown) => {
    if (isAdminError(error)) throw legalError(error.code === 'UNAUTHORIZED' ? 'UNAUTHORIZED' : 'FORBIDDEN')
    throw error
  })
  await limited(action, user.id, max)
  return user
}

export const readLegalEditor = async () =>
  await requireEditor().catch((error: unknown) => {
    throw legalError(error instanceof Error && error.message === 'Not authenticated' ? 'UNAUTHORIZED' : 'FORBIDDEN')
  })

export const expireLegal = (slug: string) => {
  updateTag(legalTag(slug))
}

export const legalAction = async <T>(work: () => Promise<T>) => {
  try {
    return { data: await work(), error: null }
  } catch (error) {
    unstable_rethrow(error)
    if (isLegalError(error)) {
      return { data: null, error: { code: error.code as string, locales: error.locales, message: error.message } }
    }
    return { data: null, error: { ...queryError(error), locales: [] as string[] } }
  }
}
