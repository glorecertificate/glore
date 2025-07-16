import { parseCertificate } from '@/api/modules/certificates/parser'
import { type DatabaseClient } from '@/api/types'
import { DatabaseError, PostgRESTCode } from '@/lib/db/utils'

import { certificateQuery } from './queries'

export const find = async (db: DatabaseClient, id: number) => {
  const { data, error } = await db.from('certificates').select(certificateQuery).eq('id', id).single()

  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

  return parseCertificate(data)
}

export const list = async (db: DatabaseClient) => {
  const { data, error } = await db.from('certificates').select(certificateQuery)

  if (error) throw error
  if (!data) throw new DatabaseError(PostgRESTCode.NO_RESULTS)

  return data.map(parseCertificate)
}
