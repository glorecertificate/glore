'use server'

import 'server-only'

import { updateTag } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { z } from 'zod'

import { eraseAccount, soleAdminOrganizations } from '@/actions/account/deletion'
import { isImpersonating } from '@/actions/admin/impersonation-state'
import { getAuthUser } from '@/actions/auth'
import { getCurrentUser } from '@/actions/user'
import { queryError } from '@/db/helpers'
import { auth } from '@/lib/auth'
import { userTag } from '@/lib/cache'
import { AUTH_ROOT } from '@/lib/constants'
import { isRateLimited } from '@/lib/rate-limit'

const HOUR = 60 * 60 * 1000

const confirmationSchema = z.string().trim().toLowerCase().min(3).max(254)

export const getDeletionBlockers = async () => {
  const user = await getAuthUser()
  if (!user) return { data: null, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }

  try {
    return { data: await soleAdminOrganizations(user.id), error: null }
  } catch (error) {
    return { data: null, error: queryError(error) }
  }
}

export const deleteAccount = async (confirmation: string) => {
  if (await isImpersonating()) {
    return {
      data: null,
      error: { code: 'NOT_ALLOWED_WHILE_IMPERSONATING', message: 'Not allowed while impersonating' },
    }
  }
  const user = await getCurrentUser()
  if (await isRateLimited(`delete-account:${user.id}`, 5, HOUR)) {
    return { data: null, error: { code: 'RATE_LIMITED', message: 'Too many attempts' } }
  }

  const parsed = confirmationSchema.safeParse(confirmation)
  if (!parsed.success || parsed.data !== user.email.toLowerCase()) {
    return { data: null, error: { code: 'CONFIRMATION_MISMATCH', message: 'Confirmation does not match' } }
  }

  try {
    const result = await eraseAccount(user)
    if (!result.deleted) {
      return {
        data: { blockers: result.blockers },
        error: { code: 'SOLE_ORG_ADMIN', message: 'Transfer ownership first' },
      }
    }
  } catch (error) {
    return { data: null, error: queryError(error) }
  }

  await auth.api.signOut({ headers: await headers() })
  updateTag(userTag(user.id))
  redirect(AUTH_ROOT)
}
