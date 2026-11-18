'use server'

import 'server-only'

import { adminAction, requireAdmin } from '@/actions/admin/helpers'
import { fetchOverview } from '@/actions/admin/overview-core'

export const getAdminOverview = async () =>
  await adminAction(async () => {
    await requireAdmin()
    return await fetchOverview()
  })
