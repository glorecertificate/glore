'use server'

import 'server-only'

import { updateTag } from 'next/cache'

import { adminAction, requireAdmin, requireAdminWithLimit } from '@/actions/admin/helpers'
import { transaction } from '@/db/client'
import { saveAppSettings } from '@/db/mutations/app-settings'
import { adminError } from '@/db/mutations/moderation'
import { type AppSettingsInput, settingsInputSchema } from '@/lib/app-settings'
import { CacheTag } from '@/lib/cache'
import { loadSettings } from '@/lib/settings'

const SETTINGS_WRITES_PER_HOUR = 60

export const getSettings = async () =>
  await adminAction(async () => {
    await requireAdmin()
    return await loadSettings({ cache: false })
  })

export const saveSettings = async (input: AppSettingsInput) =>
  await adminAction(async () => {
    const user = await requireAdminWithLimit('settings', SETTINGS_WRITES_PER_HOUR)
    const parsed = settingsInputSchema.safeParse(input)
    if (!parsed.success) throw adminError('INVALID_INPUT')
    const { keys } = await transaction(tx => saveAppSettings(tx, { actorId: user.id, settings: parsed.data }))
    if (keys.length > 0) updateTag(CacheTag.Settings)
    return { keys, settings: parsed.data }
  })
