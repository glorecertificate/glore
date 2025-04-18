'use client'

import { createContext, useState } from 'react'

interface SyncStateContext {
  syncState: 'syncing' | 'error' | 'complete'
  setSyncState: (state: 'syncing' | 'error' | 'complete') => void
}

export const SyncStateContext = createContext<SyncStateContext | null>(null)

export const SyncStateProvider = (props: React.PropsWithChildren) => {
  const [syncState, setSyncState] = useState<SyncStateContext['syncState']>('complete')
  return <SyncStateContext.Provider value={{ syncState, setSyncState }} {...props} />
}
