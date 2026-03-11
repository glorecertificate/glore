import { type InferSelectModel } from 'drizzle-orm'

import { type memberships, type organizations, type regions, type users } from '@/db/schema'

type UserRow = InferSelectModel<typeof users>
type MembershipRow = InferSelectModel<typeof memberships>
type OrganizationRow = InferSelectModel<typeof organizations>
type RegionRow = Pick<InferSelectModel<typeof regions>, 'id' | 'name' | 'icon'>

export interface UserWithRelations extends UserRow {
  memberships: (MembershipRow & { organization: OrganizationRow })[]
  regions: RegionRow[]
}

export type User = ReturnType<typeof parseUser>
export type UserOrganization = User['organizations'][number]

export const parseUser = (user: UserWithRelations) => ({
  ...user,
  isAdmin: user.role === 'admin',
  canEdit: user.role === 'admin' || user.isEditor,
  organizations: user.memberships.map(({ organization, role }) => ({ ...organization, role })),
  shortName: `${user.firstName} ${user.lastName ? `${user.lastName.trim().charAt(0).toUpperCase()}.` : ''}`,
  initials: [user.firstName, user.lastName]
    .filter(Boolean)
    .map(name => name!.trim().charAt(0).toUpperCase())
    .slice(0, 2)
    .join(''),
})
