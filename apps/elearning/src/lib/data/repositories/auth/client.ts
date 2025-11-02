import { type SignInWithPasswordCredentials, type UserAttributes } from '@supabase/supabase-js'

import { cookieStore } from '@/lib/storage'
import { createDatabase, DatabaseError } from '../../supabase'
import { findUser } from '../users/client'
import { RESET_PASSWORD_REDIRECT } from './constants'
import { type VerifyUserParams } from './types'

export const login = async (credentials: SignInWithPasswordCredentials) => {
  const database = createDatabase()
  const { data, error } = await database.auth.signInWithPassword(credentials)
  if (error || !data?.user) throw new DatabaseError({ code: '28P01', message: 'Invalid credentials' })

  const user = await findUser(data.user.id)
  if (!user) throw new DatabaseError({ code: 'PGRST116', message: 'User not found' })

  cookieStore.setEncoded('user', user)

  return user
}

export const logout = async () => {
  const database = createDatabase()
  const { error } = await database.auth.signOut()
  if (error) throw new DatabaseError({ code: 'NETWORK_ERROR', message: 'Failed to log out' })

  cookieStore.delete('user')

  return true
}

export const resetPassword = async (email: string) => {
  const database = createDatabase()
  const { error } = await database.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + RESET_PASSWORD_REDIRECT,
  })
  if (error) throw new DatabaseError({ code: 'NETWORK_ERROR' })

  return true
}

export const updateAuthUser = async (attributes: UserAttributes) => {
  const database = createDatabase()
  const { data, error } = await database.auth.updateUser(attributes)
  if (error) throw error
  if (!data?.user) throw new DatabaseError({ code: 'PGRST116', message: 'User not found' })

  return data.user
}

export const verifyAuthUser = async ({ token, type }: VerifyUserParams) => {
  const database = createDatabase()
  const { data, error } = await database.auth.verifyOtp({ token_hash: token, type })
  if (error) throw error
  if (!data?.user) throw new DatabaseError({ code: '28P01', message: 'Invalid or expired token' })

  return data.user
}
