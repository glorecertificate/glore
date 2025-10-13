import { type Enums } from '../../supabase'
import { type BaseOrganization } from '../organizations/types'
import { createParser } from '../utils'
import { type User } from './types'

export interface UserMembershipRecord {
  id: number
  role: Enums<'role'>
  organization: BaseOrganization
}

export interface UserRegionRecord {
  id: number
  name: unknown
  emoji: string | null
  iconUrl: string | null
}

export interface UserRecord {
  id: string
  email: string
  phone: string | null
  username: string | null
  firstName: string | null
  lastName: string | null
  bio: string | null
  birthday: string | null
  sex: Enums<'sex'> | null
  pronouns: string | null
  country: string | null
  city: string | null
  languages: string[] | null
  locale: Enums<'locale'> | null
  avatarUrl: string | null
  isAdmin: boolean | null
  isEditor: boolean | null
  createdAt: string
  updatedAt: string
  memberships: UserMembershipRecord[]
  regions: UserRegionRecord[]
}

const parseShortName = (user: UserRecord) => {
  const nameParts = []
  if (user.firstName) nameParts.push(user.firstName)
  if (user.lastName) nameParts.push(`${user.lastName[0]}.`)
  if (nameParts.length === 0) nameParts.push(user.username ?? user.email)
  return nameParts
    .filter(Boolean)
    .map(part => part.trim())
    .join(' ')
}

export const parseUser = createParser<UserRecord, User>(user => {
  const { memberships, ...data } = user

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || null
  const initials = fullName?.split(' ').map(name => name.charAt(0).toUpperCase()) || null
  const shortName = parseShortName(user)

  return {
    ...data,
    canEdit: !!(user.isAdmin || user.isEditor),
    fullName,
    initials,
    isLearner: !(user.isAdmin || user.isEditor),
    organizations: memberships.map(({ organization, role }) => ({
      ...organization,
      role,
    })),
    shortName,
  } as User
})
