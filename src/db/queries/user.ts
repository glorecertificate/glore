import { organizationQuery } from '@/db/queries/organization'
import { type DatabaseResult, type Enums } from '@/db/types'

export type User = ReturnType<typeof parseUser>
export type UserRole = Enums<'role'>
export type UserOrganization = User['organizations'][number]

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
  onboarded_at,
  created_at,
  updated_at
` as const

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
    icon
  )
` as const

export const parseUser = (user: DatabaseResult<'users', typeof userQuery>) => ({
  ...user,
  canEdit: Boolean(user.is_admin || user.is_editor),
  organizations: user.memberships.map(({ organization, role }) => ({ ...organization, role })),
  shortName: `${user.first_name} ${user.last_name ? `${user.last_name.trim().charAt(0).toUpperCase()}.` : ''}`,
  initials: [user.first_name, user.last_name]
    .filter(Boolean)
    .map(name => name!.trim().charAt(0).toUpperCase())
    .slice(0, 2)
    .join(''),
})
