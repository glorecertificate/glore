import * as users from '@/lib/api/modules/users/requests'
import { type User } from '@/lib/api/modules/users/types'
import { type DatabaseClient } from '@/lib/api/types'
import { DatabaseError, PostgRESTCode } from '@/lib/db/utils'
import { cookies } from '@/lib/storage/client'

export const login = async (
  db: DatabaseClient,
  {
    email,
    password,
  }: Pick<User, 'email'> & {
    password: string
  },
) => {
  const { data, error } = await db.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.INVALID_CREDENTIALS)

  const user = await users.find(db, data.user.id)

  cookies.setEncoded('user', user)

  return user
}

export const logout = async (db: DatabaseClient) => {
  const { error } = await db.auth.signOut()
  if (error) throw error

  cookies.delete('user')

  return true
}
