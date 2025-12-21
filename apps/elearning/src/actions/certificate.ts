'use server'

import 'server-only'

import { cache } from 'react'

import { certificateQuery } from '@/db/queries'
import { getDatabase } from '@/db/server'
import { resolveQuery } from '@/db/utils'

export const findCertificate = cache(async (id: number) => {
  const db = await getDatabase()
  const query = db.from('certificates').select(certificateQuery).eq('id', id).single()
  return await resolveQuery(query)
})
