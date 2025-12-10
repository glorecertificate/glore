'use client'

import { createBrowserClient } from '@supabase/ssr'

import type { Database, DatabaseClient } from '@/lib/db/types'

let client: DatabaseClient | undefined

/**
 * Creates a browser-side Supabase client scoped to the public schema.
 */
export const useSupabase = () => {
  if (!client)
    client = createBrowserClient<Database, 'public'>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  return client
}
