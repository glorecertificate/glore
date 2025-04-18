import { createParser } from '@/api/utils'

import { type userQuery } from './queries'
import { type User } from './types'

export const parseUser = createParser<'users', typeof userQuery, User>(({ memberships, ...user }) => ({
  ...user,
  organizations: memberships.map(({ organization, role }) => ({
    ...organization,
    role,
  })),
}))
