'use server'

import { createDatabase } from '@/lib/db/ssr'

import { createApiClient } from './utils'

/**
 * Creates a server-side API client.
 */
export const createApi = async () => {
  const db = await createDatabase()
  return createApiClient(db)
}
