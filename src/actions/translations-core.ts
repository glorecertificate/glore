import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { getViewer } from '@/actions/viewer'
import { CacheTag, LIVE_LIFE, messagesTag } from '@/lib/cache'
import { LOCALES } from '@/lib/i18n'
import { loadCatalogs, loadOverrideEntries } from '@/lib/message-entries'

const fetchTranslations = async () => {
  'use cache'
  cacheTag(CacheTag.MessageOverrides, ...LOCALES.map(messagesTag))
  cacheLife(LIVE_LIFE)

  const catalogs = await loadCatalogs()
  return { catalogs, overrides: await loadOverrideEntries(catalogs) }
}

export const loadTranslationsData = async () => {
  const user = await getViewer()
  if (!user.canEdit) return null
  return await fetchTranslations()
}
