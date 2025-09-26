import { createParser, type SelectData } from '@/lib/db'

import { type userQuery } from './queries'
import { type User } from './types'

const parseShortName = (user: SelectData<'users', typeof userQuery>) => {
  const nameParts = []
  if (user.firstName) nameParts.push(user.firstName)
  if (user.lastName) nameParts.push(`${user.lastName[0]}.`)
  if (nameParts.length === 0) nameParts.push(user.username ?? user.email)
  return nameParts
    .filter(Boolean)
    .map(part => part.trim())
    .join(' ')
}

export const parseUser = createParser<'users', typeof userQuery, User>(user => {
  const { memberships, ...data } = user

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || null
  const initials = fullName?.split(' ').map(name => name.charAt(0).toUpperCase()) || null
  const shortName = parseShortName(user)

  return {
    ...data,
    canEdit: !!(user.isAdmin || user.isEditor),
    fullName,
    shortName,
    initials,
    isLearner: !user.isAdmin && !user.isEditor,
    organizations: memberships.map(({ organization, role }) => ({
      ...organization,
      role,
    })),
  }
})
