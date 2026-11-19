'use client'

import { useTranslations } from 'next-intl'

import { useUnreadCount } from '@/components/features/notifications/use-unread-count'
import { showsOrganizationSwitcher } from '@/components/layout/navigation'
import { INVITATIONS_POLL_INTERVAL, readInvitations } from '@/components/layout/organization-switcher'
import { useSession } from '@/components/providers/session'
import { useSidebar } from '@/components/ui/sidebar'
import { usePoll } from '@/hooks/use-poll'

export const useMenuIndicator = () => {
  const { isMobile, isTablet, open, openMobile } = useSidebar()
  const { user } = useSession()
  const t = useTranslations('Notifications')
  const unread = useUnreadCount()
  const { data: invitations } = usePoll(readInvitations, {
    enabled: (isMobile || isTablet) && showsOrganizationSwitcher(user),
    interval: INVITATIONS_POLL_INTERVAL,
  })

  const count = unread + (invitations?.length ?? 0)
  const hidden = isMobile ? !openMobile : !open
  const visible = count > 0 && hidden

  return { indicator: visible, indicatorLabel: visible ? t('bellUnread', { count }) : undefined }
}
