import { cache } from 'react'

import { certificateQuery } from '@/lib/db/schema'
import { getSupabaseClient } from '@/lib/db/server'
import { resolveSupabaseResponse } from '@/lib/db/utils'

export const findCertificate = cache(async (id: number) => {
  const supabase = await getSupabaseClient()
  const response = await supabase.from('certificates').select(certificateQuery).eq('id', id).single()
  return resolveSupabaseResponse(response)
})
