import { useEffect, useRef } from 'react'

export const useScrollReset = (key: unknown) => {
  const previous = useRef(key)

  useEffect(() => {
    if (Object.is(previous.current, key)) return
    previous.current = key
    window.scrollTo(0, 0)
  }, [key])
}
