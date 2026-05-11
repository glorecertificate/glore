'use client'

import { use } from 'react'

import { SessionContext } from '@/components/providers/session-context'

/**
 * Accesses session context for user and organization data.
 */
export const useSession = () => {
  const context = use(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
