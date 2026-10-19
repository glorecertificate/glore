import { type InferSelectModel } from 'drizzle-orm'

import { type memberships, type organizationProfiles, type organizations, type regions, type users } from '@/db/schema'

export const userWith = {
  memberships: {
    with: {
      organization: { columns: { id: true, name: true }, with: { profile: { columns: { avatarUrl: true } } } },
    },
  },
  regions: { columns: { id: true, name: true, icon: true } },
} as const

type UserRow = InferSelectModel<typeof users>
type MembershipRow = InferSelectModel<typeof memberships>
type OrganizationRow = Pick<InferSelectModel<typeof organizations>, 'id' | 'name'> & {
  profile: Pick<InferSelectModel<typeof organizationProfiles>, 'avatarUrl'> | null
}
type RegionRow = Pick<InferSelectModel<typeof regions>, 'id' | 'name' | 'icon'>

export const publicUserColumns = {
  avatarUrl: true,
  city: true,
  country: true,
  email: true,
  firstName: true,
  id: true,
  isEditor: true,
  languages: true,
  lastName: true,
  pronouns: true,
  role: true,
  username: true,
} as const

interface UserRelations {
  memberships: (MembershipRow & { organization: OrganizationRow })[]
  regions: RegionRow[]
}

interface UserWithRelations extends UserRow, UserRelations {}

export interface PublicUserWithRelations extends Pick<UserRow, keyof typeof publicUserColumns>, UserRelations {}

export type User = ReturnType<typeof parseUser<UserWithRelations>>
export type PublicUser = ReturnType<typeof parseUser<PublicUserWithRelations>>
export type UserOrganization = User['organizations'][number]

export const parseUser = <T extends PublicUserWithRelations>(user: T) => ({
  ...user,
  isAdmin: user.role === 'admin',
  canEdit: user.role === 'admin' || user.isEditor,
  organizations: user.memberships.map(({ organization, role }) => ({
    id: organization.id,
    name: organization.name,
    avatarUrl: organization.profile?.avatarUrl ?? null,
    role,
  })),
  shortName: `${user.firstName} ${user.lastName ? `${user.lastName.trim().charAt(0).toUpperCase()}.` : ''}`,
  initials: [user.firstName, user.lastName]
    .flatMap(name => (name ? [name.trim().charAt(0).toUpperCase()] : []))
    .slice(0, 2)
    .join(''),
})
