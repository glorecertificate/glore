'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { useHeader } from '@/hooks/use-header'

export const RouteListener = () => {
  const { setBreadcrumb, setHeaderShadow, setSubHeader } = useHeader()
  const pathname = usePathname()

  useEffect(() => {
    setBreadcrumb(undefined)
    setSubHeader(undefined)
    setHeaderShadow(true)
  }, [pathname, setSubHeader, setBreadcrumb, setHeaderShadow])

  return <></>
}
