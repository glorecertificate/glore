'use client'

import { useDatabase } from '@/hooks/use-database'
import { createApiClient } from '@/lib/api'

/**
 * Creates a client-side API client.
 */
export const useApi = () => {
  const db = useDatabase()
  return createApiClient(db)
}
