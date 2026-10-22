import 'server-only'

import { and, eq, inArray, ne } from 'drizzle-orm'

import { notify } from '@/actions/notifications/notify'
import { db, transaction } from '@/db/client'
import { recordEvent } from '@/db/mutations/activity-event'
import { deleteUser } from '@/db/mutations/user'
import { type AppEvent } from '@/db/queries/activity-event'
import { memberships, organizations } from '@/db/schema'
import { r2DeleteQuietly } from '@/lib/storage'

export const soleAdminOrganizations = async (userId: string) => {
  const owned = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
    .where(and(eq(memberships.userId, userId), eq(memberships.role, 'admin')))
  if (owned.length === 0) return []

  const covered = await db
    .selectDistinct({ organizationId: memberships.organizationId })
    .from(memberships)
    .where(
      and(
        inArray(
          memberships.organizationId,
          owned.map(({ id }) => id)
        ),
        eq(memberships.role, 'admin'),
        ne(memberships.userId, userId)
      )
    )
  const coveredIds = new Set(covered.map(({ organizationId }) => organizationId))
  return owned.filter(({ id }) => !coveredIds.has(id))
}

export const eraseAccount = async (user: { email: string; firstName: string; id: string; locale: string | null }) => {
  const blockers = await soleAdminOrganizations(user.id)
  if (blockers.length > 0) return { blockers, deleted: false }

  const event = {
    actorId: user.id,
    data: { email: user.email, firstName: user.firstName, locale: user.locale, userId: user.id },
    organizationId: null,
    type: 'account.deleted',
  } satisfies AppEvent<'account.deleted'>

  const deleted = await transaction(async tx => {
    await recordEvent(tx, event)
    return await deleteUser(tx, user.id)
  })
  if (deleted?.avatarUrl) await r2DeleteQuietly(deleted.avatarUrl)
  await notify(event)

  return { blockers: [], deleted: true }
}
