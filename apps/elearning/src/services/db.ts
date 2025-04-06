import { cookies } from 'next/headers'

import { createServerClient } from '@supabase/ssr'
import { type SupabaseAuthClient } from '@supabase/supabase-js/dist/module/lib/SupabaseAuthClient'

import { Env } from '@/lib/env'
import type i18n from 'config/i18n.json'
import type { Database } from 'supabase/types'

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

export type * from 'supabase/types'
export interface AuthClient extends SupabaseAuthClient {}
export type LocalizedJson = Record<keyof typeof i18n.locales, string>
