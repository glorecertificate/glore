'use server'

import 'server-only'

import { cache } from 'react'
import { cacheTag, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import type { UserResponse } from '@supabase/supabase-js'

import { parseUser, userQuery } from '@/db/queries'
import { getDatabase } from '@/db/server'
import type { _DatabaseQuery, DatabaseQuery, TableUpdate } from '@/db/types'
import { resolveQuery } from '@/db/utils'
import { CacheTag } from '@/lib/types'

const fetchAuthUser = async (query: Promise<UserResponse>) => {
  'use cache'
  cacheTag(CacheTag.AuthUser)

  const { data, error } = await query
  if (error) throw error

  return data.user
}

const fetchUser = async (query: DatabaseQuery<'users', typeof userQuery, 'single'>) => {
  'use cache'
  cacheTag(CacheTag.User)

  const { data, error } = await resolveQuery(query, parseUser)
  if (error) throw error

  return data
}

const fetchUserEmail = async (query: DatabaseQuery<'users', 'email', 'single'>) => {
  'use cache'
  cacheTag(CacheTag.UserEmail)

  const { data, error } = await resolveQuery(query)
  if (error) throw error

  return data.email
}

const fetchTeamMembers = async (query: _DatabaseQuery<'users', typeof userQuery>) => {
  'use cache'
  cacheTag(CacheTag.User)

  return await resolveQuery(query, parseUser)
}

export const getCurrentUser = cache(async () => {
  const db = await getDatabase()
  const query = db.auth.getUser()

  try {
    const user = await fetchAuthUser(query)
    return await findUser(user.id)
  } catch {
    redirect('/login')
  }
})

export const findUser = async (id: string) => {
  const db = await getDatabase()

  const query = db.from('users').select(userQuery).eq('id', id).single()
  return await fetchUser(query)
}

export const findUserEmail = async (username: string) => {
  const db = await getDatabase()

  const query = db.from('users').select('email').or(`email.eq.${username},username.eq.${username}`).single()
  const email = await fetchUserEmail(query)

  updateTag(CacheTag.UserEmail)
  return email
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
