import { redirect } from 'next/navigation'

import { log } from '@repo/utils'

import { type DatabaseClient } from '@/api/types'
import { Route } from '@/lib/navigation'

import { organizationQuery } from './queries'
import { type Organization } from './types'

export const find = async (db: DatabaseClient, id: number): Promise<Organization> => {
  const { data, error, status } = await db.from('organizations').select(organizationQuery).eq('id', id).single()

  if ((error && status !== 406) || !data) {
    if (error) log.error(error)
    redirect(Route.Login)
  }

  return data
}
