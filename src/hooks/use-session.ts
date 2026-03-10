'use client'

import { useContext } from 'react'

import { SessionContext } from '@/components/providers/session-context'

/**
 * Accesses session context for user and organization data.
 */
export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
