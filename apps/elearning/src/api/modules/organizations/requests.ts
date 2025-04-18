import { redirect } from 'next/navigation'

import { createDatabaseClient } from '@/lib/db/server'
import { Route } from '@/lib/navigation'

import { organizationQuery } from './queries'
import { type Organization } from './types'

export const get = async (id: number): Promise<Organization> => {
  const db = await createDatabaseClient()

  const { data, error, status } = await db.from('organizations').select(organizationQuery).eq('id', id).single()

  if ((error && status !== 406) || !data) {
    if (error) console.error(error)
    redirect(Route.Login)
  }

  return data
}
