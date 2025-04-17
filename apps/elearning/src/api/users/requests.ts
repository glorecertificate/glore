'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { selectUserQuery } from '@/api/users/queries'
import { Route } from '@/lib/navigation'
import { Cookie } from '@/lib/storage'
import { getDB } from '@/services/db'

export const getCurrentUserId = async () => {
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

export const getCurrentUser = async () => {
  const db = await getDB()

  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) redirect(Route.Login)

  const { data, error, status } = await db.from('profiles').select(selectUserQuery).eq('uuid', user.id).single()

  if ((error && status !== 406) || !data) {
    if (error) console.error(error)
    redirect(Route.Login)
  }

  const { get } = await cookies()
  const currentOrgId = Number(get(Cookie.CurrentOrg)?.value) || null

  const { avatar_url, user_organizations, ...userData } = data

  const orgs = user_organizations.map(({ organizations, role }) => ({ ...organizations, role }))
  const current_org = orgs.find(org => org.id === currentOrgId) || orgs[0]

  return {
    ...userData,
    name: `${userData.first_name} ${userData.last_name}`,
    avatar_url: avatar_url || undefined,
    orgs,
    current_org,
  }
}
