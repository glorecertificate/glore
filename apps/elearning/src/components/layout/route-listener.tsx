'use client'

import { useEffect } from 'react'

import { useHeader } from '@/hooks/use-header'
import { useNavigation } from '@/hooks/use-navigation'

export const RouteListener = () => {
  const { setHeader, showShadow } = useHeader()
  const { pathname, setUiPathname } = useNavigation()

  useEffect(() => {
    setHeader(undefined)
    showShadow(true)
    setUiPathname(pathname)
  }, [pathname, setHeader, setUiPathname, showShadow])

  return null
}
