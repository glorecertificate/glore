'use server'

import 'server-only'

import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import type { SignInWithPasswordCredentials } from '@supabase/supabase-js'

import { getDatabase } from '@/db/server'
import { CacheTag } from '@/lib/types'

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
