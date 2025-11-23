import { courseQuery } from '../courses/queries'
import { organizationQuery } from '../organizations/queries'
import { baseUserQuery } from '../users/queries'

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
  skills:courses (
    ${courseQuery}
  ),
  organization:organizations (
    ${organizationQuery}
  ),
  reviewer:users!user_id (
    ${baseUserQuery}
  )
`
