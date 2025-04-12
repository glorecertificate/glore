import { useContext } from 'react'

import { HeaderContext } from '@/components/providers/header-provider'

export const useHeader = () => {
  const context = useContext(HeaderContext)
  if (!context) throw new Error('useHeader must be used within a HeaderProvider')
  return context
}
