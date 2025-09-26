import { DatabaseError, type DatabaseClient } from '@/lib/db'
import { getEncodedCookie } from '@/lib/storage/ssr'

import { parseUser } from './parser'
import { userQuery } from './queries'
import { resetUser } from './utils'

export const getCurrent = async (db: DatabaseClient) => {
  try {
    const user = await getEncodedCookie('user')
    if (user) return user

    const { data, error } = await db.auth.getUser()
    if (error || !data?.user) return resetUser()

    const currentUser = await find(db, data.user.id)
    if (!currentUser) return resetUser()

    return currentUser
  } catch {
    throw new DatabaseError('NO_RESULTS', 'User not found')
  }
}

export const find = async (db: DatabaseClient, id: string) => {
  const { data, error } = await db.from('users').select(userQuery).eq('id', id).single()
  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS', 'User not found')

  return parseUser(data)
}

export const findByUsername = async (db: DatabaseClient, username: string) => {
  const { data, error } = await db
    .from('users')
    .select(userQuery)
    .or(`email.eq.${username},username.eq.${username}`)
    .single()

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS', 'User not found')

  return parseUser(data)
}
