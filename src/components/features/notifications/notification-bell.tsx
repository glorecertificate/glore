'use client'

import { useEffect, useEffectEvent, useState } from 'react'

import { useTranslations } from 'next-intl'

import { countUnreadNotifications } from '@/actions/notifications/inbox'
import { NOTIFICATIONS_CHANGED } from '@/components/features/notifications/events'
import { NotificationPopover } from '@/components/features/notifications/notification-popover'
import { LucideIcon } from '@/components/icons/lucide'
import { SidebarCount } from '@/components/layout/sidebar-count'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { usePoll } from '@/hooks/use-poll'
import { cn } from '@/lib/utils'

const readUnread = async () => {
  const { data, error } = await countUnreadNotifications()
  if (error) throw new Error(error.message)
  return data
}

export const NotificationBell = ({ children, className, ...props }: React.ComponentProps<typeof Button>) => {
  const t = useTranslations('Notifications')
  const [open, setOpen] = useState(false)
  const { data, refresh } = usePoll(readUnread, { interval: 60_000 })
  const unread = data ?? 0

  const onChanged = useEffectEvent(refresh)

  useEffect(() => {
    window.addEventListener(NOTIFICATIONS_CHANGED, onChanged)
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED, onChanged)
  }, [])

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button className={cn('relative', className)} size={children ? 'md' : 'icon'} variant="ghost" {...props}>
          <LucideIcon className="size-4" name="bell" />
          {children}
          {!children && <span className="sr-only">{t('bell')}</span>}
          {unread > 0 && <SidebarCount count={unread} label={t('bellUnread', { count: unread })} />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-1.5rem))] p-0" sideOffset={8}>
        <NotificationPopover onChange={refresh} onNavigate={() => setOpen(false)} unread={unread} />
      </PopoverContent>
    </Popover>
  )
}
