import { useLayoutEffect, useRef } from 'react'

export const useResetOnHide = (reset: () => void) => {
  const latest = useRef(reset)
  const pending = useRef<ReturnType<typeof setTimeout>>(undefined)

  useLayoutEffect(() => {
    latest.current = reset
  })

  useLayoutEffect(() => {
    clearTimeout(pending.current)
    const pathname = window.location.pathname
    return () => {
      pending.current = setTimeout(() => {
        if (window.location.pathname === pathname) return
        latest.current()
      })
    }
  }, [])
}
