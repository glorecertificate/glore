'use client'

import { useDatabase } from '@/hooks/use-database'
import { API_MODULES } from '@/lib/api/config'
import { createClient } from '@/lib/api/utils'

/**
 * Creates a client-side API client.
 */
export const useApi = () => {
  const db = useDatabase()
  return createClient(API_MODULES, db)
}
