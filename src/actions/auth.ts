'use server'

import 'server-only'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import { type SignInWithPasswordCredentials, type UserAttributes } from '@supabase/supabase-js'

import { getDatabase } from '@/db/client'
import { CacheTag } from '@/lib/cache'

export const login = async (credentials: SignInWithPasswordCredentials) => {
  const db = await getDatabase()

  const { error } = await db.auth.signInWithPassword(credentials)
  if (error) throw error

  updateTag(CacheTag.AuthUser)
  redirect('/')
}

export const logout = async () => {
  const db = await getDatabase()

  const { error } = await db.auth.signOut()
  if (error) throw error

  updateTag(CacheTag.AuthUser)
  redirect('/login')
}

export const getAuthUser = async () => {
  const db = await getDatabase()

  const { data, error } = await db.auth.getUser()
  if (error) throw error

  return data.user
}

export const updateAuthUser = async (attributes: UserAttributes) => {
  const db = await getDatabase()

  const { data, error } = await db.auth.updateUser(attributes)
  if (error) throw error

  return data.user
}

export const resetPassword = async (
  email: string,
  options?: {
    redirectTo?: string
  }
) => {
  const db = await getDatabase()

  const { error } = await db.auth.resetPasswordForEmail(email, options)
  if (error) throw error
}

export const updatePassword = async (token: string, password: string) => {
  const db = await getDatabase()

  const { error: verifyError } = await db.auth.verifyOtp({ type: 'email', token_hash: token })
  if (verifyError) throw verifyError

  const { error } = await db.auth.updateUser({ password })
  if (error) throw error
}
