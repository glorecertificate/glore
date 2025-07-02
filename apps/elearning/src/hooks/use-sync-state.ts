import { useContext } from 'react'

import { SyncStateContext } from '@/components/providers/sync-state-provider'

/**
 * Hook to access the sync state context.
 * It provides the current sync state and methods to manage synchronization.
 */
export const useSyncState = () => {
  const context = useContext(SyncStateContext)
  if (!context) throw new Error('useSyncState must be used within a SyncStateProvider')
  return context
}
