'use client'

import { createBrowserClient } from '@supabase/ssr'

import { env } from '@/lib/env'
import type { Database } from 'supabase/types'

/**
 * Creates a client-side database client.
 */
export const useDatabase = () => createBrowserClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
