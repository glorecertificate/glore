import { type Certificate } from '@/lib/api/modules/certificates'
import { organizationQuery, type BaseOrganization } from '@/lib/api/modules/organizations'
import { type Entity } from '@/lib/api/utils'
import { createParser } from '@/lib/api/utils'
import { type DatabaseClient, type Enums, type SelectData, type Timestamp } from '@/lib/db'
import { DatabaseError, timestamps } from '@/lib/db'
import { createCookieClient } from '@/lib/storage'

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
  country,
  city,
  languages,
  locale,
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

export interface BaseUser extends Exclude<Entity<'users'>, 'phone'> {}

export interface User extends Entity<'users', never, Timestamp> {
  canEdit: boolean
  fullName: string | null
  initials: string[] | null
  isLearner: boolean
  organizations: UserOrganization[]
  phone: Entity<'users'>['phone']
  shortName: string | null
}

export interface CurrentUser extends User {
  certificates?: Certificate[]
}

export interface UserOrganization extends BaseOrganization {
  role: Enums<'role'>
}

export interface UserCourse extends Entity<'user_courses'> {}

export interface UserLesson extends Entity<'user_lessons'> {}

export interface UserAnswer extends Entity<'user_answers'> {}

export interface UserEvaluation extends Entity<'user_evaluations'> {}

export interface UserAssessment extends Entity<'user_assessments'> {}

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
    initials,
    isLearner: !(user.isAdmin || user.isEditor),
    organizations: memberships.map(({ organization, role }) => ({
      ...organization,
      role,
    })),
    shortName,
  }
})

export const getCurrentUser = async (db: DatabaseClient) => {
  const { getEncoded } = await createCookieClient()
  const user = getEncoded('user')
  if (user) return user

  const { data, error } = await db.auth.getUser()
  if (error || !data?.user) throw Error()

  const currentUser = await findUser(db, data.user.id)
  if (!currentUser) throw Error()

  return currentUser
}

export const findUser = async (db: DatabaseClient, id: string) => {
  const { data, error } = await db.from('users').select(userQuery).eq('id', id).single()
  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS', 'User not found')

  return parseUser(data)
}

export const findUserByUsername = async (db: DatabaseClient, username: string) => {
  const { data, error } = await db
    .from('users')
    .select(userQuery)
    .or(`email.eq.${username},username.eq.${username}`)
    .single()

  if (error) throw error
  if (!data) throw new DatabaseError('NO_RESULTS', 'User not found')

  return parseUser(data)
}

export default {
  find: findUser,
  findByUsername: findUserByUsername,
  getCurrent: getCurrentUser,
}
