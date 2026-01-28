'use server'

import 'server-only'

import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

import { type Database } from '@/db/types'
import { noop } from '@/lib/utils'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY)) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Returns a Supabase client for server components and actions.
 * Handles cookie management for authenticated sessions.
 *
 * @see {@link https://supabase.com/docs/guides/auth/server-side/nextjs|Supabase Docs}
 */
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

/**
 * Returns a Supabase client for public access (no cookies management).
 * Ideal for static generation and cached functions.
 *
 * @see {@link https://supabase.com/docs/reference/javascript/initializing|Supabase Docs}
 */
export const getPublicDatabase = async () =>
  await createClient<Database, 'public'>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

/**
 * Returns a Supabase admin client that bypasses RLS policies.
 * **Use with caution** and for administrative tasks only.
 *
 * @see {@link https://supabase.com/docs/reference/javascript/initializing|Supabase Docs}
 */
export const getServiceDatabase = async () =>
  await createClient<Database, 'public'>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

/**
 * Returns a Supabase client to be used in Next.js middleware requests.
 * Manages request/response cookies for session refresh.
 *
 * @see {@link https://supabase.com/docs/guides/auth/server-side/nextjs|Supabase Docs}
 */
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
