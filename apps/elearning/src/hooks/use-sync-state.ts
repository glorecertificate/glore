import { useContext } from 'react'

import { SyncStateContext } from '@/components/providers/sync-state-provider'

export const useSyncState = () => {
  const context = useContext(SyncStateContext)
  if (!context) throw new Error('useSyncState must be used within a SyncStateProvider')
  return context
}
