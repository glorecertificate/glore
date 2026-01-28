import { organizationQuery } from '@/db/queries/organization'
import { baseUserQuery } from '@/db/queries/user'
import { type DatabaseResult } from '@/db/types'

export type Certificate = DatabaseResult<'certificates', typeof certificateQuery>

export const certificateQuery = `
  id,
  handle,
  language,
  activity_start_date,
  activity_end_date,
  activity_duration,
  activity_location,
  activity_description,
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
` as const
