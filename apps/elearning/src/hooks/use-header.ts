'use client'

import { useContext, useEffect } from 'react'

import { HeaderContext } from '@/components/providers/header-provider'

export const useHeader = (header?: React.JSX.Element) => {
  const context = useContext(HeaderContext)
  if (!context) throw new Error('useHeader must be used within a HeaderProvider')

  const { setHeader } = context

  useEffect(() => {
    if (header) setHeader(header)
    return () => setHeader(undefined)
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  return context
}
