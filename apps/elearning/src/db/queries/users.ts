import type { DatabaseResult } from '@/db/types'
import { organizationQuery, parseOrganization } from './organizations'

export type User = ReturnType<typeof parseUser>
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

export const parseUser = (data: DatabaseResult<'users', typeof userQuery>) => {
  const { memberships, ...user } = data

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || null
  const initials = fullName?.split(' ').map(name => name.charAt(0).toUpperCase()) || null
  const nameParts = []
  if (user.first_name) nameParts.push(user.first_name)
  if (user.last_name) nameParts.push(`${user.last_name[0]}.`)
  if (nameParts.length === 0) nameParts.push(user.username ?? user.email)
  const shortName = nameParts
    .filter(Boolean)
    .map(part => part.trim())
    .join(' ')

  return {
    ...data,
    canEdit: !!(user.is_admin || user.is_editor),
    fullName,
    initials,
    isLearner: !(user.is_admin || user.is_editor),
    organizations: memberships.map(({ organization, role }) => ({
      ...parseOrganization(organization),
      role,
    })),
    shortName,
  }
}
