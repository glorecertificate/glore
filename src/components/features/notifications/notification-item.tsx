'use client'

import { type Route } from 'next'

import { useFormatter, useTranslations } from 'next-intl'

import { markNotificationRead } from '@/actions/notifications/inbox'
import { announceNotificationsChanged } from '@/components/features/notifications/events'
import { useNotificationText } from '@/components/features/notifications/use-notification-text'
import { notificationIcon } from '@/components/features/notifications/utils'
import { LucideIcon } from '@/components/icons/lucide'
import { Link } from '@/components/ui/link'
import { type Notification } from '@/db/queries/notification'
import { cn } from '@/lib/utils'

interface NotificationItemProps extends Omit<React.ComponentProps<'li'>, 'onClick'> {
  notification: Notification
  now: Date
  onNavigate?: () => void
  onRead?: (id: number) => void
}

export const NotificationItem = ({
  className,
  notification,
  now,
  onNavigate,
  onRead,
  ...props
}: NotificationItemProps) => {
  const t = useTranslations('Notifications')
  const format = useFormatter()
  const describe = useNotificationText()
  const { body, title } = describe(notification)

  const open = async () => {
    onNavigate?.()
    if (notification.read) return
    await markNotificationRead(notification.id)
    announceNotificationsChanged()
    onRead?.(notification.id)
  }

  const content = (
    <>
      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
          notification.read ? 'bg-muted text-muted-foreground' : 'bg-brand/15 text-brand-text'
        )}
      >
        <LucideIcon className="size-4" name={notificationIcon(notification.category)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-sm', notification.read ? 'text-foreground/80' : 'font-medium text-foreground')}>
          {title}
        </span>
        {body && <span className="mt-0.5 block text-[13px] text-muted-foreground">{body}</span>}
        <time
          className="mt-1 block text-xs text-muted-foreground"
          dateTime={notification.createdAt}
          suppressHydrationWarning
        >
          {format.relativeTime(new Date(notification.createdAt), now)}
        </time>
      </span>
      {!notification.read && (
        <span className="mt-2 size-2 shrink-0 rounded-full bg-brand">
          <span className="sr-only">{t('unread')}</span>
        </span>
      )}
    </>
  )

  const itemClass =
    'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/60'

  return (
    <li className={className} {...props}>
      {notification.href ? (
        <Link className={itemClass} href={notification.href as Route} onClick={open}>
          {content}
        </Link>
      ) : (
        <button className={cn(itemClass, 'cursor-pointer')} onClick={open} type="button">
          {content}
        </button>
      )}
    </li>
  )
}
