'use server'

import 'server-only'

import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

import { createServerClient } from '@supabase/ssr'

import { type Database } from '@/db/types'
import { noop } from '@/lib/utils'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!(SUPABASE_URL && SUPABASE_ANON_KEY)) {
  throw new Error('Missing Supabase environment variables')
}

export const getDatabase = async (callback = noop) => {
  const { getAll, set } = await cookies()

  return createServerClient<Database, 'public'>(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
  createServerClient<Database, 'public'>(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
