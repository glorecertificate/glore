import { getSession } from '@/api/modules/auth/requests'
import { type DatabaseClient } from '@/api/types'
import { DatabaseError, PostgRESTCode } from '@/lib/db/utils'

import { parseUser } from './parser'
import { userQuery } from './queries'
import { type CurrentUser } from './types'

export const getCurrent = async (db: DatabaseClient): Promise<CurrentUser> => {
  const { user } = await getSession(db)

  const { data, error } = await db.from('users').select(userQuery).eq('id', user.id).single()

  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

  return parseUser(data)
}
