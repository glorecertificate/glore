import type { QueryData } from '@supabase/supabase-js'

import type { DatabaseClient } from '@/lib/db/types'

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

export const selectOrganization = (client: DatabaseClient) =>
  client.from('organizations').select(organizationQuery).single()

export const parseOrganization = (data: QueryData<ReturnType<typeof selectOrganization>>) => ({
  ...data,
  shortName: data.name.slice(0, 2).toUpperCase(),
})
