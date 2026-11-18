'use client'

import { useSyncExternalStore } from 'react'

import { countUnreadNotifications } from '@/actions/notifications/inbox'
import { NOTIFICATIONS_CHANGED } from '@/components/features/notifications/events'

const POLL_INTERVAL = 60_000

const listeners = new Set<() => void>()
const increaseListeners = new Set<() => void>()

let loaded = false

let count = 0
let request = 0
let timer: ReturnType<typeof setInterval> | undefined

const emit = () => {
  for (const listener of listeners) listener()
}

const refreshUnreadCount = async () => {
  request += 1
  const current = request
  try {
    const { data, error } = await countUnreadNotifications()
    const next = data ?? 0
    if (error || current !== request || next === count) return false
    const increased = loaded && next > count
    loaded = true
    count = next
    emit()
    if (increased) for (const listener of increaseListeners) listener()
    return true
  } catch {
    return false
  }
}

const refreshWhenVisible = () => {
  if (document.visibilityState === 'visible') void refreshUnreadCount()
}

const onChanged = () => void refreshUnreadCount()

const start = () => {
  refreshWhenVisible()
  timer = setInterval(refreshWhenVisible, POLL_INTERVAL)
  document.addEventListener('visibilitychange', refreshWhenVisible)
  window.addEventListener(NOTIFICATIONS_CHANGED, onChanged)
}

const stop = () => {
  clearInterval(timer)
  timer = undefined
  document.removeEventListener('visibilitychange', refreshWhenVisible)
  window.removeEventListener(NOTIFICATIONS_CHANGED, onChanged)
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  if (listeners.size === 1) start()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) stop()
  }
}

const getSnapshot = () => count

const getServerSnapshot = () => 0

export const useUnreadCount = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

export const onUnreadIncrease = (listener: () => void) => {
  increaseListeners.add(listener)
  return () => {
    increaseListeners.delete(listener)
  }
}
