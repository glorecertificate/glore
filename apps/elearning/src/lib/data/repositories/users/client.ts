import { cookieStore } from '@/lib/storage'
import { type DatabaseClient, DatabaseError } from '../../supabase'
import { createDatabase } from '../../supabase/client'
import { createRepositoryRunner, expectSingle } from '../utils'
import { userQuery } from './queries'
import { type CurrentUser, type User } from './types'
import { parseUser } from './utils'

const run = createRepositoryRunner(createDatabase)

const loadUser = async (database: DatabaseClient, id: string) => {
  const result = await database.from('users').select(userQuery).eq('id', id).single()
  return parseUser(expectSingle(result, 'PGRST116', 'User not found'))
}

export const getUser = async () =>
  run(async database => {
    const { data } = await database.auth.getUser()
    if (!data.user) throw new DatabaseError({ code: 'PGRST401', message: 'Unauthenticated' })

    return loadUser(database, data.user.id)
  })

export const getCurrentUser = async () =>
  run(async database => {
    const cached = cookieStore.getEncoded('user') as CurrentUser | undefined
    if (cached) return cached

    const { data, error } = await database.auth.getUser()
    if (error || !data?.user) throw new DatabaseError({ code: 'PGRST401', message: 'Unauthenticated' })

    return (await loadUser(database, data.user.id)) as CurrentUser
  })

export const findUser = async (id: string): Promise<User> => run(database => loadUser(database, id))

export const findUserEmail = async (username: string): Promise<string> =>
  run(async database => {
    const result = await database
      .from('users')
      .select('email')
      .or(`email.eq.${username},username.eq.${username}`)
      .single()

    const user = expectSingle(result, 'PGRST116', 'User not found') as { email: string }
    return user.email
  })

export const updateUser = async (
  updates: Partial<{
    username: string
    first_name: string
    lastName: string
    bio: string
    birthday: string
    sex: string
    pronouns: string
    country: string
    city: string
    languages: string[]
    locale: string
    avatar_url: string
    phone: string
  }>
) => {
  const response = await fetch('/api/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new DatabaseError({
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Failed to update user',
    })
  }

  const user: CurrentUser = await response.json()
  cookieStore.setEncoded('user', user)

  return user
}

export const getTeamMembers = async () =>
  run(async database => {
    const { data, error } = await database
      .from('users')
      .select(userQuery)
      .or('is_admin.eq.true,is_editor.eq.true')
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data ?? []).map(parseUser)
  })
