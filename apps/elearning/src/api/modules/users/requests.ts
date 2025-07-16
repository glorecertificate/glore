import { redirect } from 'next/navigation'

import { type DatabaseClient } from '@/api/types'
import { DatabaseError, PostgRESTCode } from '@/lib/db/utils'
import { Route } from '@/lib/navigation'
import { cookies } from '@/lib/storage'

import { parseUser } from './parser'
import { userQuery } from './queries'

export const current = () => {
  const user = cookies.get('user')
  if (!user) return redirect(Route.Login)
  return user
}

export const getCurrent = async (db: DatabaseClient) => {
  const { id } = current()

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
