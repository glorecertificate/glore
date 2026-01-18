import { type DatabaseResult } from '@/db/types'

export type Organization = ReturnType<typeof parseOrganization>

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
  avatar_url,
  approved_at,
  created_at,
  updated_at
`

export const parseOrganization = (data: DatabaseResult<'organizations', typeof organizationQuery>) => ({
  ...data,
  shortName: data.name.slice(0, 2).toUpperCase(),
})
