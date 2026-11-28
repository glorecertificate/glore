'use client'

import { useLayoutEffect } from 'react'

import { LoadingFallback } from '@/components/layout/loading-fallback'
import { navigationProgress } from '@/lib/navigation-progress'

export const RouteLoading = () => {
  useLayoutEffect(() => navigationProgress.hold(), [])

  return <LoadingFallback className="cursor-progress" size="page" spinner={false} />
}
