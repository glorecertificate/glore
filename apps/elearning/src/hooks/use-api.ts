'use client'

import { useDatabase } from '@/hooks/use-database'
import { api } from '@/lib/api'
import { createClient } from '@/lib/api/utils'

/**
 * Creates a client-side API client.
 */
export const useApi = () => {
  const db = useDatabase()
  return createClient(api, db)
}
