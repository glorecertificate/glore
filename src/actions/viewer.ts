import 'server-only'

import { redirect } from 'next/navigation'
import { cache } from 'react'

import { getSessionUser } from '@/actions/session'
import { USER_NOT_FOUND, fetchUser } from '@/actions/user-data'
import { SESSION_ROOT } from '@/lib/constants'
import { getCookie } from '@/lib/cookie-store'

export const getViewer = cache(async () => {
  const session = await getSessionUser()
  if (!session) redirect(SESSION_ROOT)

  const { data, error } = await fetchUser(session.id)
  if (error?.message === USER_NOT_FOUND) redirect(SESSION_ROOT)
  if (error || !data) throw new Error(error?.message ?? USER_NOT_FOUND)

  return data
})

export const getViewerOrgId = cache(async () => {
  const [user, stored] = await Promise.all([getViewer(), getCookie('org')])
  const match = user.organizations.find(({ id }) => id === stored)
  return (match ?? user.organizations[0])?.id ?? null
})

export const getViewerContext = cache(async () => {
  const [user, orgId] = await Promise.all([getViewer(), getViewerOrgId()])
  const role = user.organizations.find(({ id }) => id === orgId)?.role ?? null
  return { orgId, role, user }
})
