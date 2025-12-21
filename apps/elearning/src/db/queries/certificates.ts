import type { DatabaseResult } from '@/db/types'
import { organizationQuery } from './organizations'
import { baseUserQuery } from './users'

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

export type Certificate = DatabaseResult<'certificates', typeof certificateQuery>
