'use client'

import { useContext } from 'react'

import { SessionContext } from '@/components/providers/session-provider'

/**
 * Hook to access the session context.
 * It provides the current session data and methods to manage the session.
 */
export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession must be used within a SessionProvider')
  return context
}
