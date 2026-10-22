import 'server-only'

import { type Transaction } from '@/db/client'
import { type AppEvent, eventMetadata, eventSubject } from '@/db/queries/activity-event'
import { activityEvents } from '@/db/schema'

export const recordEvent = async (tx: Transaction, event: AppEvent) => {
  const subject = eventSubject(event)
  const [row] = await tx
    .insert(activityEvents)
    .values({
      action: event.type,
      actorId: event.actorId,
      metadata: eventMetadata(event),
      organizationId: event.organizationId,
      subjectId: subject.id,
      subjectType: subject.type,
    })
    .returning()
  if (!row) throw new Error('Failed to record event')
  return row
}
