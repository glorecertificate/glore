'use client'

import { useEffect, useEffectEvent } from 'react'

import { type Shortcut, matchesShortcut } from '@/lib/shortcuts'

export const useShortcut = (shortcut: Shortcut | undefined, handler: (event: KeyboardEvent) => void) => {
  const key = shortcut?.key
  const mod = shortcut?.mod ?? false
  const onShortcut = useEffectEvent(handler)

  useEffect(() => {
    if (!key) return
    const listener = (event: KeyboardEvent) => {
      if (!matchesShortcut(event, { key, mod })) return
      event.preventDefault()
      onShortcut(event)
    }
    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [key, mod])
}
