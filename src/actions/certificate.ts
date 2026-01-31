'use server'

import 'server-only'

import { cache } from 'react'

import { getDatabase } from '@/db/client'
import { resolveQuery } from '@/db/helpers'
import { certificateQuery } from '@/db/queries/certificate'

export const findCertificate = cache(async (id: number) => {
  const db = await getDatabase()
  const query = db.from('certificates').select(certificateQuery).eq('id', id).single()
  return await resolveQuery(query)
})
