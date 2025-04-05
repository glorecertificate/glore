import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { Route } from '@/lib/navigation'
import { Cookie } from '@/lib/storage'
import { mapModule } from '@/services/db/utils'

import { getDB } from './client'
import type { User } from './types'

export const fetchUser = async (): Promise<User> => {
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

export const fetchAllModules = async () => {
  const db = await getDB()

  const { data, error } = await db.from('modules').select(
    `
      *,
      skills (
        *,
        subskills (
          *
        )
      ),
      module_steps(count)
    `,
  )

  if (error || !data) {
    if (error) console.error(error)
    return []
  }

  return data.map(module => mapModule(module))
}

export const fetchModule = async (slug: string) => {
  const db = await getDB()

  const { data, error } = await db
    .from('modules')
    .select(
      `
        *,
        skills!inner (
          *,
          subskills (
            *
          )
        ),
        module_steps(count)
      `,
    )
    .eq('skills.slug', slug)
    .single()

  if (!data) {
    if (error) console.error(error)
    return null
  }

  return mapModule(data)
}
