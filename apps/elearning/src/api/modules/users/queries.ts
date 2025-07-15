import { organizationQuery } from '@/api/modules/organizations/queries'

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
  createdAt:created_at,
  updatedAt:updated_at,
  deletedAt:deleted_at
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
