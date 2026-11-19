'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { NotificationPopover } from '@/components/features/notifications/notification-popover'
import { useUnreadCount } from '@/components/features/notifications/use-unread-count'
import { LucideIcon } from '@/components/icons/lucide'
import { SidebarCount } from '@/components/layout/sidebar-count'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export const NotificationBell = ({ children, className, ...props }: React.ComponentProps<typeof Button>) => {
  const t = useTranslations('Notifications')
  const [open, setOpen] = useState(false)
  const unread = useUnreadCount()

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button className={cn('relative', className)} size={children ? 'md' : 'icon'} variant="ghost" {...props}>
          <LucideIcon className="size-4" name="bell" />
          {children}
          {!children && <span className="sr-only">{t('bell')}</span>}
          {unread > 0 && <SidebarCount count={unread} floating label={t('bellUnread', { count: unread })} />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-1.5rem))] p-0" sideOffset={8}>
        <NotificationPopover onNavigate={() => setOpen(false)} unread={unread} />
      </PopoverContent>
    </Popover>
  )
}
