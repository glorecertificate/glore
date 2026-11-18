'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { onUnreadIncrease, useUnreadCount } from '@/components/features/notifications/use-unread-count'

export const LiveRefresh = () => {
  const router = useRouter()
  useUnreadCount()

  useEffect(() => onUnreadIncrease(() => router.refresh()), [router])

  return null
}
