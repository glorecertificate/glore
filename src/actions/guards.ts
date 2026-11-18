import 'server-only'

import { headers } from 'next/headers'
import { connection } from 'next/server'

import { auth } from '@/lib/auth'

interface RoleFields {
  banned?: boolean | null
  isEditor?: boolean | null
  role?: string | null
}

export const isEditorUser = (user: RoleFields | null | undefined) =>
  !!user && !user.banned && (user.role === 'admin' || !!user.isEditor)

const getFreshSessionUser = async () => {
  await connection()
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } })
  return session?.user ?? null
}

export const requireEditor = async () => {
  const user = await getFreshSessionUser()
  if (!user) throw new Error('Not authenticated')
  if (!isEditorUser(user)) throw new Error('Not authorized')
  return user
}
