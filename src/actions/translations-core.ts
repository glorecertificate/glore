import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { getViewer } from '@/actions/viewer'
import { CacheTag } from '@/lib/cache'
import { loadCatalogs, loadOverrideEntries } from '@/lib/message-entries'

const fetchCatalogs = async () => {
  'use cache'
  cacheTag(CacheTag.Messages)
  cacheLife('max')

  return await loadCatalogs()
}

export const loadTranslationsData = async () => {
  const user = await getViewer()
  if (!user.canEdit) return null
  const catalogs = await fetchCatalogs()
  return { catalogs, overrides: await loadOverrideEntries(catalogs) }
}
