import { courseQuery, parseCourse, type Course } from '@/lib/api/modules/courses'
import { organizationQuery, type Organization } from '@/lib/api/modules/organizations'
import { baseUserQuery, type BaseUser } from '@/lib/api/modules/users'
import { type Entity } from '@/lib/api/utils'
import { createParser } from '@/lib/api/utils'
import { type DatabaseClient, type Timestamp } from '@/lib/db'
import { DatabaseError, timestamps } from '@/lib/db'

export interface Certificate extends Entity<'certificates', never, Timestamp> {
  organization: Organization
  reviewer: BaseUser | null
  skills: Course[]
}

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
  ${timestamps},
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

export const parseCertificate = createParser<'certificates', typeof certificateQuery, Certificate>(
  ({ skills, ...certificate }) =>
    ({
      ...certificate,
      skills: skills.map(parseCourse),
    }) as Certificate
)

export const findCertificate = async (db: DatabaseClient, id: number | string) => {
  const { data, error } = await db.from('certificates').select(certificateQuery).eq('id', Number(id)).single()

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return parseCertificate(data)
}

export const listCertificates = async (db: DatabaseClient) => {
  const { data, error } = await db.from('certificates').select(certificateQuery)

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return data.map(parseCertificate)
}

export default {
  find: findCertificate,
  list: listCertificates,
}
