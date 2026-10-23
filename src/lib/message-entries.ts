import 'server-only'

import { db } from '@/db/client'
import { messageOverrides } from '@/db/schema/message-overrides'
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n'
import { classifyOverride } from '@/lib/message-overrides'
import { type RawCatalog } from '@/lib/message-validation'
import { loadRawMessages } from '@/lib/messages'
import { type OverrideEntry } from '@/lib/translation-table'

export const loadCatalogs = async () => {
  const entries = await Promise.all(LOCALES.map(async locale => [locale, await loadRawMessages(locale)] as const))
  return Object.fromEntries(entries) as Record<string, RawCatalog>
}

export const loadOverrideEntries = async (catalogs: Record<string, RawCatalog>): Promise<OverrideEntry[]> => {
  const rows = await db.select().from(messageOverrides).orderBy(messageOverrides.key, messageOverrides.locale)
  const en = catalogs[DEFAULT_LOCALE] ?? {}
  return rows.map(row => ({
    draftValue: row.draftValue,
    key: row.key,
    locale: row.locale,
    origin: row.origin,
    publishedAt: row.publishedAt,
    stale: classifyOverride({ bundled: catalogs[row.locale] ?? {}, en, locale: row.locale, override: row }),
    updatedAt: row.updatedAt,
    value: row.value,
  }))
}
