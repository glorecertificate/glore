'use client'

import { useMemo } from 'react'

import { createBrowserClient } from '@supabase/ssr'

import type { Database, DatabaseClient } from '@/db/types'

let client: DatabaseClient | undefined

export const useDatabase = () =>
  useMemo<DatabaseClient>(() => {
    if (!client) {
      client = createBrowserClient<Database, 'public'>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
    return client
  }, [])
