import { useContext } from 'react'

import { SyncStatusContext } from '@/components/providers/sync-status-provider'

export const useSyncStatus = () => {
  const context = useContext(SyncStatusContext)
  if (!context) throw new Error('useSyncStatus must be used within a SyncStatusProvider')
  return context
}
