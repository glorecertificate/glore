'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { useBreadcrumb } from '@/components/ui/breadcrumb'

export const RouteChangeListener = () => {
  const { setBreadcrumb } = useBreadcrumb()
  const pathname = usePathname()

  useEffect(() => {
    setBreadcrumb(undefined)
  }, [pathname, setBreadcrumb])

  return null
}
