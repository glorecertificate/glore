'use server'

import 'server-only'

import { cache } from 'react'
import { cacheTag, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import { getAuthUser } from '@/actions/auth'
import { getDatabase } from '@/db/client'
import { parseUser, userQuery } from '@/db/schema/users'
import { type DatabaseQuery, type DatabaseSingleQuery, type TableUpdate } from '@/db/types'
import { resolveQuery } from '@/db/utils'
import { CacheTag } from '@/lib/cache'
import { AUTH_ROOT } from '@/lib/constants'

const fetchUser = async (query: DatabaseSingleQuery<'users', typeof userQuery>) => {
  'use cache'
  cacheTag(CacheTag.User)

  const { data, error } = await resolveQuery(query, parseUser)
  if (error) throw error

  return data
}

const fetchUserEmail = async (query: DatabaseSingleQuery<'users', 'email'>) => {
  'use cache'
  cacheTag(CacheTag.UserEmail)

  return await resolveQuery(query)
}

const fetchTeamMembers = async (query: DatabaseQuery<'users', typeof userQuery>) => {
  'use cache'
  cacheTag(CacheTag.User)

  return await resolveQuery(query, parseUser)
}

export const getCurrentUser = cache(async () => {
  const user = await getAuthUser()
  if (!user) redirect(AUTH_ROOT)
  return await findUser(user.id)
})

export const findUser = async (id: string) => {
  const db = await getDatabase()

  const query = db.from('users').select(userQuery).eq('id', id).single()
  return await fetchUser(query)
}

export const findUserEmail = async (username: string) => {
  const db = await getDatabase()

  const query = db.from('users').select('email').or(`email.eq.${username},username.eq.${username}`).single()
  const response = await fetchUserEmail(query)

  updateTag(CacheTag.UserEmail)
  return response
}

export const updateUser = async (id: string, values: TableUpdate<'users'>) => {
  const db = await getDatabase()

  const query = db.from('users').update(values).eq('id', id).select(userQuery).single()
  const user = await fetchUser(query)

  updateTag(CacheTag.User)
  return user
}

export const getTeamMembers = async () => {
  const db = await getDatabase()
  const query = db.from('users').select(userQuery).or('is_admin.eq.true,is_editor.eq.true')
  return await fetchTeamMembers(query)
}
