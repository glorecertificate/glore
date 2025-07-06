import { redirect } from 'next/navigation'

import { type DatabaseClient } from '@/api/types'
import { Route } from '@/lib/navigation'

import { organizationQuery } from './queries'
import { type Organization } from './types'

export const get = async (db: DatabaseClient, id: number): Promise<Organization> => {
  const { data, error, status } = await db.from('organizations').select(organizationQuery).eq('id', id).single()

  if ((error && status !== 406) || !data) {
    if (error) console.error(error)
    redirect(Route.Login)
  }

  return data
}
