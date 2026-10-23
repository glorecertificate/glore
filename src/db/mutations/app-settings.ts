import 'server-only'

import { type Transaction } from '@/db/client'
import { recordEvent } from '@/db/mutations/activity-event'
import { appSettings } from '@/db/schema/app-settings'
import { type AppSettings, changedSettings, parseSettings } from '@/lib/app-settings'

export const saveAppSettings = async (
  tx: Transaction,
  { actorId, settings }: { actorId: string; settings: AppSettings }
) => {
  const rows = await tx.select({ key: appSettings.key, value: appSettings.value }).from(appSettings).for('update')
  const keys = changedSettings(parseSettings(rows), settings)
  if (keys.length === 0) return { event: null, keys }

  const updatedAt = new Date().toISOString()
  for (const key of keys) {
    await tx
      .insert(appSettings)
      .values({ key, updatedById: actorId, value: settings[key] })
      .onConflictDoUpdate({ set: { updatedAt, updatedById: actorId, value: settings[key] }, target: appSettings.key })
  }
  const event = await recordEvent(tx, { actorId, data: { keys }, organizationId: null, type: 'settings.updated' })
  return { event, keys }
}
