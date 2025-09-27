import { TIMESTAMPS } from '@/lib/db'

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
  ${TIMESTAMPS}
`
