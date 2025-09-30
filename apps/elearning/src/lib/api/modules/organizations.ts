import { type Entity } from '@/lib/api/utils'
import { type DatabaseClient, type Timestamp } from '@/lib/db'
import { DatabaseError, timestamps } from '@/lib/db'

export interface BaseOrganization extends Entity<'organizations'> {}
export interface Organization extends Entity<'organizations', 'description', Timestamp> {}
export interface Region extends Entity<'regions'> {}

export const organizationQuery = `
  id,
  handle,
  name,
  email,
  description,
  url,
  phone,
  country,
  region,
  postcode,
  city,
  address,
  rating,
  avatarUrl:avatar_url,
  approvedAt:approved_at,
  ${timestamps}
`

export const findOrganization = async (db: DatabaseClient, id: number): Promise<Organization> => {
  const { data, error } = await db.from('organizations').select(organizationQuery).eq('id', id).single()

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS')

  return data as Organization
}

export default {
  find: findOrganization,
}
