'use server'

import { cookies } from 'next/headers'

import { createServerClient } from '@supabase/ssr'

import { noop } from '@repo/utils/noop'

import { env } from '@/lib/env'
import { type Database } from 'supabase/types'

export const createDatabase = async (callback = noop) => {
  const { getAll, set } = await cookies()

  return createServerClient<Database, 'public'>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll,
      setAll: cookies => {
        for (const { name, options, value } of cookies) {
          set(name, value, options)
        }
        callback()
      },
    },
  })
}
