import { useEffect, useState } from 'react'

/**
 * Debounces a value for a specified delay defaulting to 500ms.
 */
export const useDebounce = <T>(value: T, delay = 500) => {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const handler: NodeJS.Timeout = setTimeout(() => setDebounced(value), delay)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debounced
}
