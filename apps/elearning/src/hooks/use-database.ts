'use client'

import { createBrowserClient } from '@supabase/ssr'

import { type Database } from '@/lib/db'

/**
 * Returns a client-side database client.
 */
export const useDatabase = () =>
  createBrowserClient<Database, 'public'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
