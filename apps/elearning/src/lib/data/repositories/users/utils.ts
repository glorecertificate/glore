import { parseOrganization } from '../organizations/utils'
import { createParser } from '../utils'
import { type userQuery } from './queries'
import { type User } from './types'

export const parseUser = createParser<'users', typeof userQuery, User>(user => {
  const { memberships, ...data } = user

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
})
