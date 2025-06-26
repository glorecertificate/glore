'use client'

import { useEffect } from 'react'

import { useHeader } from '@/hooks/use-header'
import { usePathname } from '@/hooks/use-pathname'

export const RouteListener = () => {
  const { setHeader, setShadow } = useHeader()
  const { pathname } = usePathname()

  useEffect(() => {
    setHeader(undefined)
    setShadow(false)
  }, [pathname, setHeader, setShadow])

  return <></>
}
