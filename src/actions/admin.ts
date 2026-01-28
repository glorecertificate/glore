'use server'

import 'server-only'

import { cacheTag, revalidateTag } from 'next/cache'

import { getCurrentUser } from '@/actions/user'
import { getDatabase, getServiceDatabase } from '@/db/client'
import { resolveQuery } from '@/db/helpers'
import { parseUser, userQuery } from '@/db/queries/user'
import { type DatabaseQuery } from '@/db/types'
import { CacheTag } from '@/lib/cache'

const fetchTeamMembers = async (query: DatabaseQuery<'users', typeof userQuery>) => {
  'use cache'
  cacheTag(CacheTag.TeamMembers)

  return await resolveQuery(query, parseUser)
}

export const getTeamMembers = async () => {
  const db = await getDatabase()
  const query = db.from('users').select(userQuery).or('is_admin.eq.true,is_editor.eq.true')
  return await fetchTeamMembers(query)
}

export const inviteTeamMember = async (email: string, role: 'admin' | 'editor', redirectTo: string) => {
  const user = await getCurrentUser()
  if (!user.is_admin) return { error: 'You must be an admin to invite team members' }

  const db = await getServiceDatabase()

  const { data, error } = await db.auth.admin.inviteUserByEmail(email, { redirectTo, data: { role } })
  if (error) return { error: error.message }

  revalidateTag(CacheTag.User, 'max')
  return { data: data.user }
}
