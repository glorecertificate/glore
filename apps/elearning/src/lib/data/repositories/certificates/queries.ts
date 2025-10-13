import { courseQuery } from '../courses/queries'
import { organizationQuery } from '../organizations/queries'
import { baseUserQuery } from '../users/queries'
import { TIMESTAMPS } from '../utils'

export const certificateQuery = `
  id,
  handle,
  language,
  activityStartDate:activity_start_date,
  activityEndDate:activity_end_date,
  activityDuration:activity_duration,
  activityLocation:activity_location,
  activityDescription:activity_description,
  organizationRating:organization_rating,
  reviewerComment:reviewer_comment,
  documentUrl:document_url,
  issuedAt:issued_at,
  ${TIMESTAMPS},
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
