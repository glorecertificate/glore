import { useEffect, useState } from 'react'

/**
 * Hook to determine if the component is mounted.
 * Useful for avoiding state updates on unmounted components.
 */
export const useMounted = () => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}
