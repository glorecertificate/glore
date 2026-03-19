'use client'

import { BellIcon, CheckCheckIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { type Notification } from '@/db/queries/notification'
import { type NotificationDataMap } from '@/db/schema/notifications'
import { useNotifications } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'

const getNotificationDisplay = (
  notification: Notification,
  t: ReturnType<typeof useTranslations<'Notifications'>>
): { href: string; title: string } => {
  const type = notification.type
  const data = notification.data as Record<string, unknown>

  if (type === 'certificate_assigned') {
    return {
      href: '/organization',
      title: t('certificate_assigned'),
    }
  }

  if (type === 'certificate_reviewed') {
    const reviewData = data as NotificationDataMap['certificate_reviewed']
    return {
      href: `/certificates/${reviewData.certificateId}`,
      title: reviewData.status === 'approved' ? t('certificate_reviewed_approved') : t('certificate_reviewed_changes'),
    }
  }

  if (type === 'member_added') {
    const memberData = data as NotificationDataMap['member_added']
    return {
      href: '/dashboard',
      title: t('member_added', { organization: memberData.organizationName }),
    }
  }

  if (type === 'join_request_decided') {
    const requestData = data as NotificationDataMap['join_request_decided']
    return {
      href: '/dashboard',
      title:
        requestData.status === 'accepted'
          ? t('join_request_accepted', { organization: requestData.organizationName })
          : t('join_request_rejected', { organization: requestData.organizationName }),
    }
  }

  return { href: '/dashboard', title: '' }
}

const NotificationItem = ({ notification, onRead }: { notification: Notification; onRead: (id: number) => void }) => {
  const t = useTranslations('Notifications')
  const { href, title } = getNotificationDisplay(notification, t)

  const handleClick = () => {
    if (!notification.read) onRead(notification.id)
  }

  return (
    <a
      className={cn(
        'flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/60',
        !notification.read && 'bg-accent/40'
      )}
      href={href}
      onClick={handleClick}
    >
      <span
        className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', notification.read ? 'bg-transparent' : 'bg-brand')}
      />
      <span className="min-w-0 flex-1">
        <span className={cn('block text-sm leading-snug', !notification.read && 'font-medium')}>{title}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">
          {new Date(notification.createdAt).toLocaleDateString()}
        </span>
      </span>
    </a>
  )
}

export const NotificationBell = () => {
  const t = useTranslations('Notifications')
  const { markAllRead, markRead, notifications, unreadCount } = useNotifications()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="relative" size="icon" variant="ghost" aria-label={t('title')}>
          <BellIcon className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold">{t('title')}</span>
          {unreadCount > 0 && (
            <Button
              className="h-auto gap-1.5 px-2 py-1 text-xs text-muted-foreground"
              size="sm"
              variant="ghost"
              onClick={markAllRead}
            >
              <CheckCheckIcon className="size-3.5" />
              {t('markAllRead')}
            </Button>
          )}
        </div>
        <Separator />
        <div className="max-h-[360px] overflow-y-auto p-1.5">
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            notifications.map(n => <NotificationItem key={n.id} notification={n} onRead={markRead} />)
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
