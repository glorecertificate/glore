import { createDatabaseClient } from '@/lib/db/server'
import { DatabaseError, PostgRESTCode } from '@/lib/db/utils'

import { type Session } from './types'

/**
 * Retrieves the current session from the database.
 */
export const getSession = async () => {
  const db = await createDatabaseClient()

  const { data, error } = await db.auth.getSession()

  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

  return data.session as Session
}
