import { type User } from '@/api/modules/users/types'
import { type DatabaseClient } from '@/api/types'
import { DatabaseError, PostgRESTCode } from '@/lib/db/utils'
import { cookies } from '@/lib/storage/client'

export const login = async (
  db: DatabaseClient,
  {
    password,
    ...user
  }: User & {
    password: string
  },
) => {
  const { data, error } = await db.auth.signInWithPassword({ email: user.email, password })
  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.INVALID_CREDENTIALS)

  cookies.setEncoded('user', user)

  return data
}

export const logout = async (db: DatabaseClient) => {
  const { error } = await db.auth.signOut()
  if (error) throw error

  cookies.delete('user')

  return true
}
