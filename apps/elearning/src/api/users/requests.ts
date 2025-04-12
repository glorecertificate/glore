'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { Route } from '@/lib/navigation'
import { Cookie } from '@/lib/storage'
import { getDB } from '@/services/db'

import type { User } from './types'

export const fetchCurrentUserId = async (): Promise<number> => {
  const db = await getDB()

  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) redirect(Route.Login)

  const { data, error, status } = await db.from('profiles').select('id').eq('uuid', user.id).single()

  if ((error && status !== 406) || !data) {
    if (error) console.error(error)
    redirect(Route.Login)
  }

  const { id } = data
  if (!id) redirect(Route.Login)
  return id
}

export const fetchCurrentUser = async (): Promise<User> => {
  const db = await getDB()

  const { get } = await cookies()
  const currentOrg = Number(get(Cookie.CurrentOrg)?.value) || null

  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) redirect(Route.Login)

  const { data, error, status } = await db
    .from('profiles')
    .select(
      `
        *,
        user_organizations (
          role,
          organizations (
            id,
            name,
            avatar_url,
            country
          )
        ),
        user_modules (
          *
        )
      `,
    )
    .eq('uuid', user.id)
    .single()

  if ((error && status !== 406) || !data) {
    if (error) console.error(error)
    redirect(Route.Login)
  }

  const { avatar_url, user_modules, user_organizations, ...userData } = data

  const orgs = user_organizations.map(({ organizations, role }) => ({
    ...organizations,
    role,
    isActive: organizations.id === currentOrg,
  }))

  return {
    ...userData,
    avatar_url: avatar_url || undefined,
    modules: user_modules,
    name: `${userData.first_name} ${userData.last_name}`,
    orgs,
  }
}
