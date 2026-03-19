'use client'

import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { listNotifications, markAllNotificationsRead, markNotificationRead } from '@/actions/notification'
import { type Notification } from '@/db/queries/notification'

interface NotificationsContextInput {
  notifications: Notification[]
}

const useNotificationsContext = ({ notifications: initial }: NotificationsContextInput) => {
  const [notifications, setNotifications] = useState(initial)
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  const refresh = useCallback(async () => {
    const { data } = await listNotifications()
    if (data) setNotifications(data)
  }, [])

  useEffect(() => {
    const poll = setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, 30_000)
    return () => clearInterval(poll)
  }, [refresh])

  const markRead = useCallback(async (id: number) => {
    await markNotificationRead(id)
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  return useMemo(
    () => ({ markAllRead, markRead, notifications, refresh, unreadCount }),
    [markAllRead, markRead, notifications, refresh, unreadCount]
  )
}

export const NotificationsContext = createContext<ReturnType<typeof useNotificationsContext> | null>(null)

export const NotificationsContextProvider = ({ value, ...props }: React.ProviderProps<NotificationsContextInput>) => {
  const providerValue = useNotificationsContext(value)
  return <NotificationsContext.Provider value={providerValue} {...props} />
}
