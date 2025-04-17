'use server'

import { redirect } from 'next/navigation'

import { Route } from '@/lib/navigation'
import { getDB } from '@/services/db'

export const getOrganization = async (params: { id: number }) => {
  const db = await getDB()

  const { data, error, status } = await db.from('organizations').select('*').eq('id', params.id).single()

  if ((error && status !== 406) || !data) {
    if (error) console.error(error)
    redirect(Route.Login)
  }

  return data
}
