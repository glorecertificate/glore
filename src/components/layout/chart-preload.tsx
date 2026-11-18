'use client'

import { useEffect } from 'react'

export const ChartPreload = () => {
  useEffect(() => {
    const load = () => void import('@/components/ui/chart-renderer')
    const handle = window.setTimeout(load, 1500)
    return () => window.clearTimeout(handle)
  }, [])

  return null
}
