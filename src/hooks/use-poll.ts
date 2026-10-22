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

  const load = useEffectEvent(async () => {
    try {
      setData(await read())
    } catch (error) {
      console.error('Polling failed', error)
    }
  })

  useEffect(() => {
    if (!enabled) return undefined
    const tick = () => {
      if (document.visibilityState === 'visible') void load()
    }
    tick()
    const timer = setInterval(tick, interval)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [enabled, interval, key, version])

  const refresh = () => setVersion(current => current + 1)

  return { data, refresh }
}
