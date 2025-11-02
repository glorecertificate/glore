'use server'

import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

import { createServerClient } from '@supabase/ssr'
import { type Database } from 'supabase/types'

import { noop } from '@glore/utils/noop'

import { type DatabaseClient } from './types'

/**
 * Creates a server-side database client scoped to the public schema.
 */
export const getDatabase = async (callback = noop): Promise<DatabaseClient> => {
  const { getAll, set } = await cookies()

  return createServerClient<Database, 'public'>(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll,
      setAll: cookies => {
        try {
          for (const { name, options, value } of cookies) {
            set(name, value, options)
          }
        } catch {}
        callback()
      },
    },
  })
}

/**
 * Creates a server-side database client scoped to the public schema, proxying cookies from the request.
 */
export const getProxyDatabase = async (request: NextRequest, callback = noop): Promise<DatabaseClient> =>
  createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: cookies => {
        for (const { name, value } of cookies) {
          request.cookies.set(name, value)
        }
        const response = NextResponse.next({ request })
        for (const { name, value, options } of cookies) {
          response.cookies.set(name, value, options)
        }
        callback()
      },
    },
  })

/**
 * Creates a server-side database client with service role, scoped to the public schema.
 *
 * **⚠️ Use with caution**: this client has elevated privileges and should only be used in secure server-side contexts.
 */
export const getServiceDatabase = async (callback = noop): Promise<DatabaseClient> => {
  const { getAll, set } = await cookies()

  return createServerClient<Database, 'public'>(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      getAll,
      setAll: cookies => {
        try {
          for (const { name, options, value } of cookies) {
            set(name, value, options)
          }
        } catch {}
        callback()
      },
    },
  })
}
