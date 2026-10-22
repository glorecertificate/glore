import 'server-only'

import { and, eq, inArray, ne } from 'drizzle-orm'

import { db } from '@/db/client'
import { memberships, organizations, users } from '@/db/schema'
import { type EnumType } from '@/db/types'

export const organizationMemberIds = async (
  organizationId: number | null,
  roles: EnumType<'role'>[],
  { exclude }: { exclude?: string } = {}
) => {
  if (!organizationId) return []
  const rows = await db
    .select({ userId: memberships.userId })
    .from(memberships)
    .where(
      and(
        eq(memberships.organizationId, organizationId),
        inArray(memberships.role, roles),
        exclude ? ne(memberships.userId, exclude) : undefined
      )
    )
  return rows.map(({ userId }) => userId)
}

export const platformAdminIds = async () => {
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin'))
  return rows.map(({ id }) => id)
}

export const organizationNameOf = async (organizationId: number | null) => {
  if (!organizationId) return ''
  const organization = await db.query.organizations.findFirst({
    columns: { name: true },
    where: eq(organizations.id, organizationId),
  })
  return organization?.name ?? ''
}

export const usernameOf = async (userId: string) => {
  const user = await db.query.users.findFirst({ columns: { username: true }, where: eq(users.id, userId) })
  return user?.username ?? ''
}
