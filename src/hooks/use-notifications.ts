'use client'

import { use } from 'react'

import { NotificationsContext } from '@/components/providers/notifications-context'

export const useNotifications = () => {
  const context = use(NotificationsContext)
  if (!context) throw new Error('useNotifications must be used within a NotificationsProvider')
  return context
}
