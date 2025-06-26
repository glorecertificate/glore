import { createParser } from '@/api/utils'

import { type userQuery } from './queries'
import { type User } from './types'

export const parseUser = createParser<'users', typeof userQuery, User>(({ memberships, ...user }) => ({
  ...user,
  canEdit: user.isAdmin || user.isEditor,
  isLearner: !user.isAdmin && !user.isEditor,
  organizations: memberships.map(({ organization, role }) => ({
    ...organization,
    role,
  })),
}))
