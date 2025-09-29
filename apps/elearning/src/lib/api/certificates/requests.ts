import { DatabaseError, type DatabaseClient } from '@/lib/db'

import { parseCertificate } from './parser'
import { certificateQuery } from './queries'

export const find = async (db: DatabaseClient, id: number | string) => {
  const { data, error } = await db.from('certificates').select(certificateQuery).eq('id', Number(id)).single()

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return parseCertificate(data)
}

export const list = async (db: DatabaseClient) => {
  const { data, error } = await db.from('certificates').select(certificateQuery)

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return data.map(parseCertificate)
}
