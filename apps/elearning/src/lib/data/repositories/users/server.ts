'use server'

import { cache } from 'react'

import { serverCookies } from '@/lib/storage/server'
import { type DatabaseClient, DatabaseError } from '../../supabase'
import { getDatabase } from '../../supabase/server'
import { createRepositoryRunner, expectSingle } from '../utils'
import { userQuery } from './queries'
import { type CurrentUser, type User } from './types'
import { parseUser } from './utils'

const run = createRepositoryRunner(getDatabase)

const loadUser = async (database: DatabaseClient, id: string): Promise<User> => {
  const result = await database.from('users').select(userQuery).eq('id', id).single()
  return parseUser(expectSingle(result, 'PGRST116', 'User not found'))
}

const requireAuthUser = async (database: DatabaseClient) => {
  const { data } = await database.auth.getUser()
  if (!data.user) throw new DatabaseError({ code: 'PGRST401', message: 'Unauthenticated' })
  return data.user
}

export const getUser = cache(
  async (): Promise<User> =>
    run(async database => {
      const user = await requireAuthUser(database)
      return loadUser(database, user.id)
    })
)

export const getCurrentUser = cache(
  async (): Promise<CurrentUser> =>
    run(async database => {
      const cookies = await serverCookies()

      const cached = await cookies.getEncoded('user')
      if (cached) return cached

      const user = await requireAuthUser(database)

      return (await loadUser(database, user.id)) as CurrentUser
    })
)

export const findUser = cache(async (id: string): Promise<User> => run(database => loadUser(database, id)))
