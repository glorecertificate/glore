'use client'

import { useEffect, useRef } from 'react'

export const useNavigationGuard = (enabled: boolean) => {
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!enabledRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
}
