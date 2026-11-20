'use client'

import { useSyncExternalStore } from 'react'

import { listNotifications } from '@/actions/notifications/inbox'
import { NOTIFICATIONS_CHANGED } from '@/components/features/notifications/events'
import { onUnreadIncrease } from '@/components/features/notifications/use-unread-count'

type NotificationPage = NonNullable<Awaited<ReturnType<typeof listNotifications>>['data']>

interface NotificationPageState {
  data: NotificationPage | null
  failed: boolean
}

const PAGE_LIMIT = 10
const FRESH_FOR = 10_000

const listeners = new Set<() => void>()

const empty: NotificationPageState = { data: null, failed: false }

let state = empty
let fetchedAt = 0
let stale = false
let version = 0
let request = 0
let pending = false

const set = (next: NotificationPageState) => {
  state = next
  for (const listener of listeners) listener()
}

export const loadNotificationPage = async ({ force = false }: { force?: boolean } = {}) => {
  const fresh = state.data !== null && !stale && Date.now() - fetchedAt < FRESH_FOR
  if (!force && (pending || fresh)) return
  request += 1
  const current = request
  const startedAt = version
  pending = true
  if (state.failed && state.data === null) set(empty)
  try {
    const { data, error } = await listNotifications({ limit: PAGE_LIMIT })
    if (error || !data) throw new Error(error?.message)
    if (current !== request) return
    fetchedAt = Date.now()
    stale = startedAt !== version
    set({ data, failed: false })
  } catch {
    if (current === request) set({ ...state, failed: true })
  } finally {
    if (current === request) pending = false
  }
}

const resetNotificationPage = () => {
  request += 1
  pending = false
  stale = false
  fetchedAt = 0
  set(empty)
}

const markStale = () => {
  version += 1
  stale = true
}

export const watchNotificationPage = () => {
  window.addEventListener(NOTIFICATIONS_CHANGED, markStale)
  const stopIncrease = onUnreadIncrease(markStale)
  return () => {
    window.removeEventListener(NOTIFICATIONS_CHANGED, markStale)
    stopIncrease()
    resetNotificationPage()
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => state

export const useNotificationPage = () => useSyncExternalStore(subscribe, getSnapshot, () => empty)
