'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to determine if the component is mounted.
 */
export const useMounted = () => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
