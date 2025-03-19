import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { createServerClient } from '@supabase/ssr'
import type { SupabaseAuthClient } from '@supabase/supabase-js/dist/module/lib/SupabaseAuthClient'

import { Env } from '@/lib/env'
import { Route } from '@/lib/navigation'
import { Cookie } from '@/lib/storage'
import type { Database } from 'supabase/types'

export type Auth = SupabaseAuthClient
export type User = Awaited<ReturnType<typeof getUser>>

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

export const getUser = async () => {
  const db = await getDB()

  const { get } = await cookies()
  const currentOrg = Number(get(Cookie.CurrentOrg)?.value) || null

  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user) redirect(Route.Login)

  const { data, error, status } = await db.from('profiles').select(
    `
      *,
      user_organizations (
        role,
        organizations (
          id,
          name,
          avatar_url,
          country
        )
      )
    `,
  )

  if ((error && status !== 406) || !data?.at(0)) {
    if (error) console.error(error)
    redirect(Route.Login)
  }

  const { avatar_url, user_organizations, ...userData } = data[0]

  const orgs = user_organizations.map(({ organizations, role }) => ({
    ...organizations,
    role,
    isActive: organizations.id === currentOrg,
  }))

  return {
    ...userData,
    avatar_url: avatar_url || undefined,
    name: `${userData.first_name} ${userData.last_name}`,
    orgs,
    currentOrg: orgs.find(({ id }) => id === currentOrg) || orgs[0],
  }
}
