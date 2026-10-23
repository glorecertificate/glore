'use server'

import 'server-only'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import { getLocale } from 'next-intl/server'

import { impersonationLocked } from '@/actions/admin/impersonation-state'
import { getAuthUser } from '@/actions/auth'
import { transaction } from '@/db/client'
import { safeQuery } from '@/db/helpers'
import { acceptCurrentLegal } from '@/db/mutations/legal'
import { userTag } from '@/lib/cache'
import { AUTH_ROOT } from '@/lib/constants'

export const acceptLegal = async () => {
  const authUser = await getAuthUser()
  if (!authUser) redirect(AUTH_ROOT)
  const locked = await impersonationLocked()
  if (locked) return { data: null, error: locked }

  const locale = await getLocale()
  const result = await safeQuery(() => transaction(tx => acceptCurrentLegal(tx, { locale, userId: authUser.id })))
  if (result.error) return { data: null, error: result.error }

  updateTag(userTag(authUser.id))
  return { data: { accepted: result.data.length }, error: null }
}
