import { useEffect, useState } from 'react'

/**
 * Debounces a value for a specified delay or 500ms by default.
 */
export const useDebounce = <T>(value: T, delay = 500) => {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const handler: NodeJS.Timeout = setTimeout(() => setDebounced(value), delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debounced
}
