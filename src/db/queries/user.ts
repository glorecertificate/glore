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
