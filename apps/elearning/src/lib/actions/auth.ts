'use server'

import type { SignInWithPasswordCredentials, UserAttributes, VerifyOtpParams } from '@supabase/supabase-js'
import type { Locale } from 'next-intl'

import { findUser } from '@/lib/actions/user'
import { getSupabaseClient } from '@/lib/db/server'
import { SupabaseError } from '@/lib/db/utils'

export const login = async (credentials: SignInWithPasswordCredentials) => {
  const supabase = await getSupabaseClient()

  const { data, error } = await supabase.auth.signInWithPassword(credentials)
  if (error) throw error
  if (!data.user) throw new SupabaseError({ code: 'PGRST116', message: 'User not found' })

  const user = await findUser(data.user.id)
  if (!user) {
    await supabase.auth.signOut()
    throw new SupabaseError({ code: 'PGRST116', message: 'User not found' })
  }

  return user
}

export const logout = async () => {
  const supabase = await getSupabaseClient()

  const { error } = await supabase.auth.signOut()
  if (error) throw new SupabaseError({ message: 'Failed to log out' })

  return true
}

export const requestPasswordReset = async (email: string, locale?: Locale) => {
  const supabase = await getSupabaseClient()

  const localeParam = locale ? `?locale=${locale}` : ''
  const redirectTo = `${window.location.origin}${localeParam}`

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) throw new SupabaseError({ message: 'Failed to request new password' })

  return true
}

export const updateAuthUser = async (attributes: UserAttributes) => {
  const supabase = await getSupabaseClient()

  const { data, error } = await supabase.auth.updateUser(attributes)
  if (error) throw error
  if (!data.user) throw new SupabaseError({ message: 'User not found' })

  return data.user
}

export const verifyAuthUser = async (params: VerifyOtpParams) => {
  const supabase = await getSupabaseClient()

  const { data, error } = await supabase.auth.verifyOtp(params)
  if (error) throw error
  if (!data.user) throw new SupabaseError({ code: '28P01', message: 'Invalid or expired token' })

  return data.user
}
