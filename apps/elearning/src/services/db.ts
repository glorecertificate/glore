import { cookies } from 'next/headers'

import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import type { SupabaseAuthClient } from '@supabase/supabase-js/dist/module/lib/SupabaseAuthClient'

import { Env } from '@/lib/env'
import { Route } from '@/lib/routes'
import type { Database, Tables } from 'supabase/types'

export type { SupabaseAuthClient as AuthClient, Database, User }

export enum Table {
  Profiles = 'profiles',
}

export interface Profile extends Tables<Table.Profiles> {
  name?: string
}

export const getDB = async (
  callback = () => {
    /**/
  },
) => {
  const cookieStore = await cookies()

  return createServerClient<Database>(Env.SUPABASE_URL, Env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: cookies => {
        for (const { name, options, value } of cookies) {
          cookieStore.set(name, value, options)
        }
        callback()
      },
    },
  })
}

export const getProfile = async (): Promise<Profile> => {
  const db = await getDB()

  const { data: userData, error: userError } = await db.auth.getUser()

  if (!userData) {
    const { redirect } = await import('next/navigation')
    redirect(Route.Login)
  }
  if (userError) {
    console.error(userError)
    throw userError
  }
  const user = userData.user

  const { data, error, status } = await db.from(Table.Profiles).select().eq('uuid', user.id).single()

  if (!data) {
    const { redirect } = await import('next/navigation')
    redirect(Route.Profile)
  }
  if (error && status !== 406) {
    console.error(error)
    throw error
  }
  const userProfile = data as Profile

  return {
    ...userProfile,
    name: `${userProfile.first_name} ${userProfile.last_name}`,
  }
}
