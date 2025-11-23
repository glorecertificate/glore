import { organizationQuery } from '../organizations/queries'

export const baseUserQuery = `
  id,
  email,
  phone,
  username,
  first_name,
  last_name,
  bio,
  birthday,
  sex,
  pronouns,
  country,
  city,
  languages,
  locale,
  avatar_url,
  is_admin,
  is_editor,
  created_at,
  updated_at
`

export const userQuery = `
  ${baseUserQuery},
  phone,
  memberships (
    id,
    role,
    organization:organizations (
      ${organizationQuery}
    )
  ),
  regions (
    id,
    name,
    emoji,
    icon_url
  )
`
