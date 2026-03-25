'use client'

import { PWAContext, usePWAContext } from '@/components/providers/pwa-context'

export const PWAContextProvider = ({ children }: React.PropsWithChildren) => {
  const value = usePWAContext()
  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>
}
