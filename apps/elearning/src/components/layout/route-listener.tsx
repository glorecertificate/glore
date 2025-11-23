'use client'

import { useEffect } from 'react'

import { useSidebar } from '@/components/ui/sidebar'
import { usePathname } from '@/hooks/use-pathname'

export const RouteListener = () => {
  const pathname = usePathname()
  const { setActivePath } = useSidebar()

  // biome-ignore lint: exhaustive-deps
  useEffect(() => {
    setActivePath(pathname)
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
