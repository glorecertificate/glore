import { organizationQuery } from '../organizations/queries'
import { TIMESTAMPS } from '../utils'

export const baseUserQuery = `
  id,
  email,
  phone,
  username,
  firstName:first_name,
  lastName:last_name,
  bio,
  birthday,
  sex,
  pronouns,
  country,
  city,
  languages,
  locale,
  avatarUrl:avatar_url,
  isAdmin:is_admin,
  isEditor:is_editor,
  ${TIMESTAMPS}
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
    iconUrl:icon_url
  )
`
