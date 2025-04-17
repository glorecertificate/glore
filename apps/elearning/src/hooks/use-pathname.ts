import { useContext } from 'react'

import { PathnameContext } from '@/components/providers/pathname-provider'

export const usePathname = () => {
  const context = useContext(PathnameContext)
  if (!context) throw new Error('usePathname must be used within a PathnameProvider')
  return context
}
