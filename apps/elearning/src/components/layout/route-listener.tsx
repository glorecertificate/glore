'use client'

import { useEffect } from 'react'

import { useSidebar } from '@/components/ui/sidebar'
import { useHeader } from '@/hooks/use-header'
import { usePathname } from '@/hooks/use-pathname'

export const RouteListener = () => {
  const { setBreadcrumb, showShadow } = useHeader()
  const pathname = usePathname()
  const { setActivePath } = useSidebar()

  // biome-ignore lint: exhaustive-deps
  useEffect(() => {
    setBreadcrumb(undefined)
    showShadow(true)
    setActivePath(pathname)
  }, [pathname])

  return null
}
