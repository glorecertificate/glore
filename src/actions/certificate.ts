import 'server-only'

import { cache } from 'react'

import { getDatabase } from '@/db/client'
import { certificateQuery } from '@/db/schema/certificates'
import { resolveQuery } from '@/db/utils'

export const findCertificate = cache(async (id: number) => {
  const db = await getDatabase()
  const query = db.from('certificates').select(certificateQuery).eq('id', id).single()
  return await resolveQuery(query)
})
