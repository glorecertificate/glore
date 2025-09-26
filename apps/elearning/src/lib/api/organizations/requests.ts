import { DatabaseError, type DatabaseClient } from '@/lib/db'

import { organizationQuery } from './queries'
import { type Organization } from './types'

export const find = async (db: DatabaseClient, id: number): Promise<Organization> => {
  const { data, error } = await db.from('organizations').select(organizationQuery).eq('id', id).single()

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return data as Organization
}
