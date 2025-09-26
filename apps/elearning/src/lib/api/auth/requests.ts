import { type VerifyOtpParams } from '@supabase/supabase-js'

import { type Locale } from '@repo/i18n'

import { type User } from '@/lib/api'
import { find as findUser } from '@/lib/api/users/requests'
import { DatabaseError, type DatabaseClient } from '@/lib/db'
import { cookies } from '@/lib/storage'

import { type AuthUserAttributes } from './types'

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
  if (!data?.user) throw new DatabaseError('INVALID_CREDENTIALS')

  const user = await findUser(db, data.user.id)
  if (!user) throw new DatabaseError('NO_RESULTS', 'User not found')

  cookies.setEncoded('user', user)

  return user
}

export const logout = async (db: DatabaseClient) => {
  const { error } = await db.auth.signOut()
  if (error) throw error

  cookies.delete('user')

  return true
}

export const resetPassword = async (
  db: DatabaseClient,
  email: string,
  options?: {
    locale?: Locale
    redirectTo?: string
  },
) => {
  if (options?.locale) await db.from('user_locales').upsert({ email, locale: options.locale })
  const { error } = await db.auth.resetPasswordForEmail(email, options)
  if (error) throw error

  return true
}

export const updateUser = async (db: DatabaseClient, attributes: AuthUserAttributes) => {
  const { data, error } = await db.auth.updateUser(attributes)
  if (error) throw error
  if (!data?.user) throw new DatabaseError('NETWORK_ERROR', "Can't update user")

  return data.user
}

export const verify = async (db: DatabaseClient, params: VerifyOtpParams) => {
  const { data, error } = await db.auth.verifyOtp(params)
  if (error) throw error
  if (!data?.user) throw new DatabaseError('INVALID_CREDENTIALS', 'Invalid or expired token')

  return data.user
}
