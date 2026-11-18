'use client'

import { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'

import { useUnreadCount } from '@/components/features/notifications/use-unread-count'
import { showsOrganizationSwitcher } from '@/components/layout/navigation'
import { INVITATIONS_POLL_INTERVAL, readInvitations } from '@/components/layout/organization-switcher'
import { useSession } from '@/components/providers/session'
import { useSidebar } from '@/components/ui/sidebar'
import { usePoll } from '@/hooks/use-poll'

const INVITATIONS_POLL_DELAY = 4000

const useAfterDelay = (delay: number) => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return ready
}

export const useMenuIndicator = () => {
  const { isMobile, isTablet, open, openMobile } = useSidebar()
  const { user } = useSession()
  const t = useTranslations('Notifications')
  const unread = useUnreadCount()
  const ready = useAfterDelay(INVITATIONS_POLL_DELAY)
  const { data: invitations } = usePoll(readInvitations, {
    enabled: ready && (isMobile || isTablet) && showsOrganizationSwitcher(user),
    interval: INVITATIONS_POLL_INTERVAL,
  })

  const count = unread + (invitations?.length ?? 0)
  const hidden = isMobile ? !openMobile : !open
  const visible = count > 0 && hidden

  return { indicator: visible, indicatorLabel: visible ? t('bellUnread', { count }) : undefined }
}
