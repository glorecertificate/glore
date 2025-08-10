'use server'

import { createDatabase } from '@/lib/db/server'

import { api } from '.'
import { createClient } from './utils'

/**
 * Creates a server-side API client.
 */
export const createApi = async () => {
  const db = await createDatabase()
  return createClient(api, db)
}
