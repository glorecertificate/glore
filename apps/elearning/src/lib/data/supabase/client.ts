'use client'

import { createBrowserClient } from '@supabase/ssr'

import { type Database, type DatabaseClient, type PublicSchema } from './types'

let client: DatabaseClient | undefined

/**
 * Creates a browser-side Supabase client scoped to the public schema.
 */
export const createDatabase = (): DatabaseClient => {
  if (!client)
    client = createBrowserClient<Database, 'public', PublicSchema>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  return client
}
