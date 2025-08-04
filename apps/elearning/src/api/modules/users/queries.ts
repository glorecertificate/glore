import { organizationQuery } from '@/api/modules/organizations/queries'
import { timestamps } from '@/api/utils'

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
  nationality,
  country,
  city,
  languages,
  avatarUrl:avatar_url,
  isAdmin:is_admin,
  isEditor:is_editor,
  ${timestamps}
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
