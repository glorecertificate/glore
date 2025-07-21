'use client'

import { useEffect } from 'react'

import { useHeader } from '@/hooks/use-header'
import { usePathname } from '@/hooks/use-pathname'

export const RouteListener = () => {
  const { setHeader, showShadow } = useHeader()
  const { pathname } = usePathname()

  useEffect(() => {
    setHeader(undefined)
    showShadow(true)
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [pathname])

  return <></>
}
