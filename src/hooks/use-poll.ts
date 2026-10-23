'use client'

import { useEffect, useEffectEvent, useState } from 'react'

interface PollOptions {
  enabled?: boolean
  interval: number
  key?: string
}

export const usePoll = <T>(read: () => Promise<T>, { enabled = true, interval, key }: PollOptions) => {
  const [data, setData] = useState<T | null>(null)
  const [version, setVersion] = useState(0)

  const load = useEffectEvent(async (isActive: () => boolean) => {
    try {
      const next = await read()
      if (isActive()) setData(next)
    } catch (error) {
      console.error('Polling failed', error)
    }
  })

  useEffect(() => {
    if (!enabled) return undefined
    let active = true
    const tick = () => {
      if (document.visibilityState === 'visible') void load(() => active)
    }
    tick()
    const timer = setInterval(tick, interval)
    document.addEventListener('visibilitychange', tick)
    return () => {
      active = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [enabled, interval, key, version])

  const refresh = () => setVersion(current => current + 1)

  return { data, refresh }
}
