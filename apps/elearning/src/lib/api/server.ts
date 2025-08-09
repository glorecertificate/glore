'use server'

import { createDatabase } from '@/lib/db/server'

import { API_MODULES } from './config'
import { createClient } from './utils'

/**
 * Creates a server-side API client.
 */
export const createApi = async () => {
  const db = await createDatabase()
  return createClient(API_MODULES, db)
}
