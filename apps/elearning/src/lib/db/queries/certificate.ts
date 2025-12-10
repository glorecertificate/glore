import type { QueryData } from '@supabase/supabase-js'

import { baseUserQuery, organizationQuery } from '@/lib/db/schema'
import type { DatabaseClient } from '@/lib/db/types'

export type Certificate = QueryData<ReturnType<typeof selectCertificate>>

export const certificateQuery = `
  id,
  handle,
  language,
  activity_start_date,
  activity_end_date,
  activity_duration,
  activity_location,
  activity_description,
  organization_rating,
  reviewer_comment,
  document_url,
  issued_at,
  created_at,
  updated_at,
  organization:organizations (
    ${organizationQuery}
  ),
  reviewer:users!user_id (
    ${baseUserQuery}
  )
`

export const selectCertificate = (client: DatabaseClient) =>
  client.from('certificates').select(certificateQuery).single()
