import { parseCertificate } from '@/api/modules/certificates/parser'
import { createDatabaseClient } from '@/lib/db/server'
import { DatabaseError, PostgRESTCode } from '@/lib/db/utils'

import { certificateQuery } from './queries'

export const get = async (id: number) => {
  const db = await createDatabaseClient()

  const { data, error } = await db.from('certificates').select(certificateQuery).eq('id', id).single()

  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

  return parseCertificate(data)
}

export const list = async () => {
  const db = await createDatabaseClient()

  const { data, error } = await db.from('certificates').select(certificateQuery)

  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

  return data.map(parseCertificate)
}
