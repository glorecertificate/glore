import { type DatabaseClient } from '@/api/types'
import { DatabaseError, PostgRESTCode } from '@/lib/db/utils'

import { type Session } from './types'

export const getSession = async (db: DatabaseClient) => {
  const { data, error } = await db.auth.getSession()

  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

  return data.session as Session
}
