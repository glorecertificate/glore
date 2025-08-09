import { createParser } from '@/lib/api/utils'

import { type userQuery } from './queries'
import { type User } from './types'

export const parseUser = createParser<'users', typeof userQuery, User>(({ memberships, ...user }) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || null
  const initials = fullName?.split(' ').map(name => name.charAt(0).toUpperCase()) || null

  return {
    ...user,
    canEdit: !!(user.isAdmin || user.isEditor),
    fullName,
    initials,
    isLearner: !user.isAdmin && !user.isEditor,
    organizations: memberships.map(({ organization, role }) => ({
      ...organization,
      role,
    })),
  }
})
