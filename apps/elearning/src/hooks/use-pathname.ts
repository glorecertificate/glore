import { useContext } from 'react'

import { PathnameContext } from '@/components/providers/pathname-provider'

/**
 * Extends the default `usePathname` hook to provide type-safe access to
 * the application routes and allow optimistic UI updates.
 */
export const usePathname = () => {
  const context = useContext(PathnameContext)
  if (!context) throw new Error('usePathname must be used within a PathnameProvider')
  return context
}
