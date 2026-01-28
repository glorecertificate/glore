'use client'

import { useEffect, useState } from 'react'

/**
 * Determines if a component is mounted.
 */
export const useMounted = () => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
