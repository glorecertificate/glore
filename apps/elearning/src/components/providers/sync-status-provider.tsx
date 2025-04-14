'use client'

import { createContext, useState } from 'react'

interface SyncStatusContext {
  syncStatus: 'syncing' | 'error' | 'complete'
  setSyncStatus: (status: 'syncing' | 'error' | 'complete') => void
}

export const SyncStatusContext = createContext<SyncStatusContext | null>(null)

export const SyncStatusProvider = (props: React.PropsWithChildren) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatusContext['syncStatus']>('complete')
  return <SyncStatusContext.Provider value={{ syncStatus, setSyncStatus }} {...props} />
}
