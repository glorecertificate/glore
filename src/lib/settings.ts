import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'

import { db } from '@/db/client'
import { appSettings } from '@/db/schema/app-settings'
import { type AppSettings, DEFAULT_SETTINGS, parseSettings } from '@/lib/app-settings'
import { CacheTag } from '@/lib/cache'

const queryRows = async () => await db.select({ key: appSettings.key, value: appSettings.value }).from(appSettings)

const fetchRows = async () => {
  'use cache'
  cacheLife('max')
  cacheTag(CacheTag.Settings)

  return await queryRows()
}

export const loadSettings = async ({ cache = true }: { cache?: boolean } = {}): Promise<AppSettings> => {
  try {
    return parseSettings(cache ? await fetchRows() : await queryRows())
  } catch (error) {
    console.error('[settings] unavailable, using the defaults', error)
    return DEFAULT_SETTINGS
  }
}
