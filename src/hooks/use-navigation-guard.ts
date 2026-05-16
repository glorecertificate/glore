'use client'

import { useEffect, useRef } from 'react'

interface UseNavigationGuardOptions {
  isDirty: boolean
  onBlock: () => Promise<boolean>
  enabled?: boolean
}

export const useNavigationGuard = ({ isDirty, enabled = true, onBlock }: UseNavigationGuardOptions) => {
  const isDirtyRef = useRef(isDirty)
  const enabledRef = useRef(enabled)
  const onBlockRef = useRef(onBlock)
  const mountPathnameRef = useRef('')
  const lastPathnameRef = useRef('')

  isDirtyRef.current = isDirty
  enabledRef.current = enabled
  onBlockRef.current = onBlock

  useEffect(() => {
    mountPathnameRef.current = window.location.pathname
    lastPathnameRef.current = window.location.pathname
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current || !enabledRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  useEffect(() => {
    const originalPush = window.history.pushState.bind(window.history)
    const originalReplace = window.history.replaceState.bind(window.history)

    const wrapMethod =
      (original: typeof window.history.pushState) => (state: unknown, unused: string, url?: string | URL | null) => {
        const nextPath =
          url === null || url === undefined
            ? window.location.pathname
            : new URL(url.toString(), window.location.origin).pathname

        if (
          nextPath === window.location.pathname ||
          window.location.pathname !== mountPathnameRef.current ||
          !isDirtyRef.current ||
          !enabledRef.current
        ) {
          original(state, unused, url)
          return
        }

        // Defer to avoid scheduling a state update during useInsertionEffect
        // (React 19 prohibits state updates triggered synchronously from that phase).
        queueMicrotask(async () => {
          const confirmed = await onBlockRef.current()
          if (!confirmed) return
          lastPathnameRef.current = nextPath
          original(state, unused, url)
        })
      }

    window.history.pushState = wrapMethod(originalPush)
    window.history.replaceState = wrapMethod(originalReplace)

    return () => {
      window.history.pushState = originalPush
      window.history.replaceState = originalReplace
    }
  }, [])

  useEffect(() => {
    let reverting = false

    const handlePopState = async () => {
      const newPathname = window.location.pathname

      if (
        newPathname === lastPathnameRef.current ||
        lastPathnameRef.current !== mountPathnameRef.current ||
        !isDirtyRef.current ||
        !enabledRef.current ||
        reverting
      ) {
        lastPathnameRef.current = newPathname
        return
      }

      reverting = true
      window.history.go(1)

      await new Promise<void>(resolve => setTimeout(resolve, 100))
      reverting = false

      const confirmed = await onBlockRef.current()
      if (!confirmed) return
      lastPathnameRef.current = newPathname
      window.history.go(-1)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
}
