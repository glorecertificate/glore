import 'server-only'

import { desc, eq } from 'drizzle-orm'

import { type FiredStaleNotice, planStaleOverrideNotice, staleOverrideCounts } from '@/actions/maintenance/plan'
import { notify } from '@/actions/notifications/notify'
import { db, transaction } from '@/db/client'
import { recordEvent } from '@/db/mutations/activity-event'
import { type AppEvent } from '@/db/queries/activity-event'
import { activityEvents } from '@/db/schema'
import { loadCatalogs, loadOverrideEntries } from '@/lib/message-entries'

const lastNotice = async (): Promise<FiredStaleNotice | null> => {
  const [row] = await db
    .select({ createdAt: activityEvents.createdAt, metadata: activityEvents.metadata })
    .from(activityEvents)
    .where(eq(activityEvents.action, 'messages.stale'))
    .orderBy(desc(activityEvents.id))
    .limit(1)
  if (!row) return null
  const { incompatible, orphaned } = row.metadata
  return {
    counts: {
      incompatible: typeof incompatible === 'number' ? incompatible : 0,
      orphaned: typeof orphaned === 'number' ? orphaned : 0,
    },
    createdAt: row.createdAt,
  }
}

export const notifyStaleOverrides = async (now = new Date()) => {
  const counts = staleOverrideCounts(await loadOverrideEntries(await loadCatalogs()))
  const planned = planStaleOverrideNotice({ counts, fired: await lastNotice(), now: now.getTime() })
  if (!planned) return { notified: false, ...counts }

  const event: AppEvent<'messages.stale'> = {
    actorId: null,
    data: planned,
    organizationId: null,
    type: 'messages.stale',
  }
  await transaction(tx => recordEvent(tx, event))
  await notify(event)
  return { notified: true, ...counts }
}
