'use server'

import 'server-only'

// biome-ignore lint/style: noRestrictedImports
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

import { createServerClient } from '@supabase/ssr'

import { noop } from '@glore/utils/noop'

import type { Database } from '@/db/types'

export const getDatabase = async (callback = noop) => {
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

export const getProxyDatabase = async (request: NextRequest, callback = noop) =>
  createServerClient<Database, 'public'>(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
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
