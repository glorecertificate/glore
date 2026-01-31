'use server'

import 'server-only'

import { cacheTag, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import { type SignInWithPasswordCredentials, type UserAttributes, type UserResponse } from '@supabase/supabase-js'

import { sendEmail } from '@/actions/email'
import { getDatabase } from '@/db/client'
import { CacheTag } from '@/lib/cache'
import { APP_ROOT } from '@/lib/constants'

const fetchAuthUser = async (query: Promise<UserResponse>) => {
  'use cache'
  cacheTag(CacheTag.AuthUser)

  const { data, error } = await query
  if (error) return null

  return data.user
}

export const login = async (credentials: SignInWithPasswordCredentials) => {
  const db = await getDatabase()
  const { error } = await db.auth.signInWithPassword(credentials)

  if (error)
    return {
      data: {
        user: null,
        session: null,
      },
      error,
    }

  revalidateTag(CacheTag.AuthUser, 'max')
  redirect(APP_ROOT)
}

export const logout = async () => {
  const db = await getDatabase()

  const { error } = await db.auth.signOut()
  if (error) throw error

  revalidateTag(CacheTag.AuthUserStatus, 'max')
}

export const getAuthUser = async () => {
  const db = await getDatabase()
  const query = db.auth.getUser()
  return await fetchAuthUser(query)
}

export const updateAuthUser = async (attributes: UserAttributes) => {
  const db = await getDatabase()

  const { data, error } = await db.auth.updateUser(attributes)
  if (error) throw error

  revalidateTag(CacheTag.AuthUser, 'max')
  return data.user
}

export const resetPassword = async (
  email: string,
  options?: {
    redirectTo?: string
  }
) => {
  const db = await getDatabase()
  return await db.auth.resetPasswordForEmail(email, options)
}

export const updatePassword = async (token: string, password: string) => {
  const db = await getDatabase()

  const { error: verifyError } = await db.auth.verifyOtp({ type: 'email', token_hash: token })
  if (verifyError) return { data: null, error: verifyError }

  return await db.auth.updateUser({ password })
}

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const db = await getDatabase()

  const {
    data: { user },
  } = await db.auth.getUser()
  if (!user?.email) throw new Error('User not found')

  const { error: signInError } = await db.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInError) return { error: signInError }

  const { data, error } = await db.auth.updateUser({ password: newPassword })
  if (error) return { error }

  sendEmail('account/password-changed', {
    to: user.email,
    username: user.user_metadata?.first_name ?? undefined,
    locale: user.user_metadata?.locale ?? undefined,
  })

  return { data: data.user }
}
