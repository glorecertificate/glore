import { getSession } from '@/api/modules/auth/requests'
import { createDatabaseClient } from '@/lib/db/server'
import { DatabaseError, PostgRESTCode } from '@/lib/db/utils'

import { parseUser } from './parser'
import { currentUserQuery } from './queries'
import { type CurrentUser } from './types'

export const getCurrent = async (): Promise<CurrentUser> => {
  const db = await createDatabaseClient()
  const { user } = await getSession()

  const { data, error } = await db.from('users').select(currentUserQuery).eq('id', user.id).single()

  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

  return parseUser(data)
}
