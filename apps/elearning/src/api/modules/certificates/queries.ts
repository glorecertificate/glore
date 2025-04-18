import { skillQuery } from '@/api/modules/courses/queries'
import { organizationQuery } from '@/api/modules/organizations/queries'
import { baseUserQuery } from '@/api/modules/users/queries'

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
  createdAt:created_at,
  updatedAt:updated_at,
  skills (
    ${skillQuery}
  ),
  organization:organizations (
    ${organizationQuery}
  ),
  reviewer:users!user_id (
    ${baseUserQuery}
  )
`
