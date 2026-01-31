'use server'

import 'server-only'

import { cache } from 'react'
import { cacheTag, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

import { getAuthUser } from '@/actions/auth'
import { sendEmail } from '@/actions/email'
import { getDatabase } from '@/db/client'
import { resolveQuery } from '@/db/helpers'
import { parseUser, userQuery } from '@/db/queries/user'
import { type DatabaseSingleQuery, type TableUpdate } from '@/db/types'
import { CacheTag } from '@/lib/cache'
import { AUTH_ROOT } from '@/lib/constants'

const fetchUser = async (query: DatabaseSingleQuery<'users', typeof userQuery>) => {
  'use cache'
  cacheTag(CacheTag.User)

  return await resolveQuery(query, parseUser)
}

const fetchUserEmail = async (query: DatabaseSingleQuery<'users', 'email'>) => {
  'use cache'
  cacheTag(CacheTag.UserEmail)

  return await resolveQuery(query)
}

export const getCurrentUser = cache(async () => {
  const user = await getAuthUser()
  if (!user) redirect(AUTH_ROOT)
  return await findUser(user.id)
})

export const findUser = async (id: string) => {
  const db = await getDatabase()

  const query = db.from('users').select(userQuery).eq('id', id).single()
  const { data, error } = await fetchUser(query)
  if (error || !data) throw error || new Error('User not found')

  return data
}

export const findUserEmail = async (username: string) => {
  const db = await getDatabase()

  const query = db
    .from('users')
    .select('email')
    .or(`email.eq."${username.replaceAll('"', '')}",username.eq."${username.replaceAll('"', '')}"`)
    .single()
  const response = await fetchUserEmail(query)

  updateTag(CacheTag.UserEmail)
  return response
}

export const updateUser = async (id: string, values: TableUpdate<'users'>, previousEmail?: string) => {
  const db = await getDatabase()

  const query = db.from('users').update(values).eq('id', id).select(userQuery).single()
  const { data, error } = await fetchUser(query)
  if (error || !data) throw error || new Error('Failed to update user')

  updateTag(CacheTag.User)

  if (values.email && previousEmail && values.email !== previousEmail) {
    const emailProps = {
      username: data.first_name ?? undefined,
      locale: data.locale ?? undefined,
      newEmail: values.email,
      oldEmail: previousEmail,
    }

    sendEmail('account/email-changed', {
      ...emailProps,
      to: values.email,
      variant: 'new',
    }).catch(console.error)

    sendEmail('account/email-changed', {
      ...emailProps,
      to: previousEmail,
      variant: 'old',
    }).catch(console.error)
  }

  return data
}
