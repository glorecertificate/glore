'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { useHeader } from '@/hooks/use-header'

export const RouteListener = () => {
  const { setBreadcrumb, setHasShadow, setSubHeader } = useHeader()
  const pathname = usePathname()

  useEffect(() => {
    setBreadcrumb(undefined)
  }, [pathname, setBreadcrumb])

  useEffect(() => {
    setSubHeader(undefined)
  }, [pathname, setSubHeader])

  useEffect(() => {
    setHasShadow(false)
  }, [pathname, setHasShadow])

  return <></>
}
