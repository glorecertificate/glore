'use server'

import { cookies } from 'next/headers'

import { createServerClient } from '@supabase/ssr'

import { noop } from '@glore/utils/noop'

import { type Database, type DatabaseClient, type PublicSchema } from './types'

/**
 * Creates a server-side database client scoped to the public schema.
 */
export const getDatabase = async (callback = noop): Promise<DatabaseClient> => {
  const { getAll, set } = await cookies()

  return createServerClient<Database, 'public', PublicSchema>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll,
        setAll(cookies) {
          for (const { name, options, value } of cookies) {
            set(name, value, options)
          }
          callback()
        },
      },
    }
  )
}

/**
 * Creates a server-side database client with service role, scoped to the public schema.
 *
 * **⚠️ Use with caution**: this client has elevated privileges and should only be used in secure server-side contexts.
 */
export const getServiceDatabase = async (callback = noop): Promise<DatabaseClient> => {
  const { getAll, set } = await cookies()

  return createServerClient<Database, 'public', PublicSchema>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll,
        setAll(cookies) {
          for (const { name, options, value } of cookies) {
            set(name, value, options)
          }
          callback()
        },
      },
    }
  )
}
