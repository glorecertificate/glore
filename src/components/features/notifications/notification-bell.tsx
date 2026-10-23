'use client'

import { useEffect, useEffectEvent, useState } from 'react'

import { useTranslations } from 'next-intl'

import { countUnreadNotifications } from '@/actions/notifications/inbox'
import { NOTIFICATIONS_CHANGED } from '@/components/features/notifications/events'
import { NotificationPopover } from '@/components/features/notifications/notification-popover'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { usePoll } from '@/hooks/use-poll'
import { cn } from '@/lib/utils'

const MAX_BADGE = 9

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
        <Button
          aria-label={unread > 0 ? t('bellUnread', { count: unread }) : t('bell')}
          className={cn('relative', className)}
          size={children ? 'md' : 'icon'}
          variant="ghost"
          {...props}
        >
          <span className={cn('relative', children && 'mr-2')}>
            <LucideIcon className="size-4" name="bell" />
            {unread > 0 && (
              <span
                aria-hidden
                className="absolute -top-2 -right-2.5 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] leading-4 font-semibold text-brand-foreground"
              >
                {unread > MAX_BADGE ? `${MAX_BADGE}+` : unread}
              </span>
            )}
          </span>
          {children}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-1.5rem))] p-0" sideOffset={8}>
        <NotificationPopover onChange={refresh} onNavigate={() => setOpen(false)} unread={unread} />
      </PopoverContent>
    </Popover>
  )
}
