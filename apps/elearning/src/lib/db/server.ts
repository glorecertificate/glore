'use server'

import { cookies } from 'next/headers'

import { createServerClient } from '@supabase/ssr'

import { noop } from '@repo/utils'

import { Env } from '@/lib/env'
import type { Database } from 'supabase/types'

export const createDatabaseClient = async (callback = noop) => {
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
