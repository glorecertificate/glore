import { cookies } from 'next/headers'

import { createServerClient } from '@supabase/ssr'

import { noop } from '@glore/utils/noop'
import { type AnyFunction } from '@glore/utils/types'

import { type Database, type DatabaseClient } from '@/lib/db'

/**
 * Creates a server-side database client.
 */
export const createDatabaseClient = async (callback: AnyFunction = noop): Promise<DatabaseClient> => {
  const { getAll, set } = await cookies()

  return createServerClient<Database, 'public'>(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll,
      setAll(cookies) {
        for (const { name, options, value } of cookies) {
          set(name, value, options)
        }
        callback()
      },
    },
  })
}
