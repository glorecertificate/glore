import { type DatabaseClient } from '@/api/types'
import { DatabaseError, PostgRESTCode } from '@/lib/db/utils'
import { cookies } from '@/lib/storage/client'
import { getEncodedCookie } from '@/lib/storage/server'

import { parseUser } from './parser'
import { userQuery } from './queries'

export const current = () => {
  const user = cookies.getEncoded('user')
  if (!user) throw new DatabaseError(PostgRESTCode.NO_RESULTS, 'User not found')
  return user
}

export const getCurrent = async () => {
  const user = await getEncodedCookie('user')
  if (!user) throw new DatabaseError(PostgRESTCode.NO_RESULTS, 'User not found')
  return user
}

export const find = async (db: DatabaseClient, id: string) => {
  const { data, error } = await db.from('users').select(userQuery).eq('id', id).single()

  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

  return parseUser(data)
}

export const findByUsername = async (db: DatabaseClient, username: string) => {
  const { data, error } = await db
    .from('users')
    .select(userQuery)
    .or(`email.eq.${username},username.eq.${username}`)
    .single()

  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

  return parseUser(data)
}
