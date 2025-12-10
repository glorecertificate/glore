'use cache'

import { cacheTag } from 'next/cache'
import { cache } from 'react'

import { CacheTag } from '@/lib/cache'
import { parseUser, userQuery } from '@/lib/db/schema'
import { getSupabaseClient } from '@/lib/db/server'
import type { DatabaseUpdate } from '@/lib/db/types'
import { resolveSupabaseResponse } from '@/lib/db/utils'

export const getCurrentUser = cache(async () => {
  cacheTag(CacheTag.CurrentUser)

  const supabase = await getSupabaseClient()

  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Unauthenticated')

  return await findUser(data.user.id)
})

export const findUser = cache(async (id: string) => {
  cacheTag(CacheTag.User)

  const supabase = await getSupabaseClient()
  const response = await supabase.from('users').select(userQuery).eq('id', id).single()

  return resolveSupabaseResponse(response, { parser: parseUser, message: 'User not found' })
})

export const findUserEmail = async (username: string) => {
  cacheTag(CacheTag.UserEmail)

  const supabase = await getSupabaseClient()
  const response = await supabase
    .from('users')
    .select('email')
    .or(`email.eq.${username},username.eq.${username}`)
    .single()

  return resolveSupabaseResponse(response, { message: 'User not found' }).email
}

export const updateUser = async (id: string, data: DatabaseUpdate<'users'>) => {
  const supabase = await getSupabaseClient()
  const response = await supabase.from('users').update(data).eq('id', id).select(userQuery).single()
  return resolveSupabaseResponse(response, { parser: parseUser, message: 'Failed to update user' })
}

export const getTeamMembers = async () => {
  'use cache'
  cacheTag(CacheTag.TeamMembers)

  const supabase = await getSupabaseClient()
  const response = await supabase
    .from('users')
    .select(userQuery)
    .or('is_admin.eq.true,is_editor.eq.true')
    .order('created_at', { ascending: false })

  return resolveSupabaseResponse(response, { parser: parseUser, message: 'No team members found' })
}
