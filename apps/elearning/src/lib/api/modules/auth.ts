import {
  type AuthCredentials,
  type AuthUser,
  type AuthUserAttributes,
  type AuthVerifyParams,
  type DatabaseClient,
  DatabaseError,
} from '@/lib/db'
import { cookies } from '@/lib/storage'
import { findUser } from './users'

export const login = async (db: DatabaseClient, credentials: AuthCredentials) => {
  const { data, error } = await db.auth.signInWithPassword(credentials)
  if (error) throw error
  if (!data?.user) throw new DatabaseError('INVALID_CREDENTIALS')

  const user = await findUser(db, data.user.id)
  if (!user) throw new DatabaseError('NO_RESULTS', 'User not found')

  cookies.setEncoded('user', user)

  return user
}

export const logout = async (db: DatabaseClient) => {
  const { error } = await db.auth.signOut()
  if (error) throw new DatabaseError('NETWORK_ERROR')

  cookies.delete('user')

  return true
}

export const resetPassword = async (db: DatabaseClient, email: string) => {
  const { error } = await db.auth.resetPasswordForEmail(email)
  if (error) throw new DatabaseError('NETWORK_ERROR')

  return true
}

export const updateUser = async (db: DatabaseClient, attributes: AuthUserAttributes): Promise<AuthUser> => {
  const { data, error } = await db.auth.updateUser(attributes)
  if (error) throw error
  if (!data?.user) throw new DatabaseError('NETWORK_ERROR')

  return data.user
}

export const verify = async (db: DatabaseClient, params: AuthVerifyParams): Promise<AuthUser> => {
  const { data, error } = await db.auth.verifyOtp(params)
  if (error) throw error
  if (!data?.user) throw new DatabaseError('INVALID_CREDENTIALS', 'Invalid or expired token')

  return data.user
}

export default {
  login,
  logout,
  resetPassword,
  updateUser,
  verify,
}
