'use client'

import { createBrowserClient } from '@supabase/ssr'

import { Env } from '@/lib/env'
import type { Database } from 'supabase/types'

/**
 * Creates a client-side database client.
 */
export const useDatabase = () => createBrowserClient<Database>(Env.SUPABASE_URL, Env.SUPABASE_ANON_KEY)
