import { useLayoutEffect, useRef } from 'react'

export const useResetOnHide = (reset: () => void) => {
  const latest = useRef(reset)
  const pending = useRef<ReturnType<typeof setTimeout>>(undefined)

  useLayoutEffect(() => {
    latest.current = reset
  })

  useLayoutEffect(() => {
    clearTimeout(pending.current)
    return () => {
      pending.current = setTimeout(() => latest.current())
    }
  }, [])
}
