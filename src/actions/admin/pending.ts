'use server'

import 'server-only'

import { loadPendingCounts } from '@/actions/admin/pending-core'
import { getCurrentUser } from '@/actions/user'

export const getPendingCounts = async () => {
  const currentUser = await getCurrentUser()
  if (!currentUser.isAdmin) return { organizations: 0, team: 0 }

  return await loadPendingCounts()
}
