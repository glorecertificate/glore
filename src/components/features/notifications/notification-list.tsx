'use client'

import { useState } from 'react'

import { useFormatter, useTranslations } from 'next-intl'

import { NotificationItem } from '@/components/features/notifications/notification-item'
import { groupByDay } from '@/components/features/notifications/utils'
import { type Notification } from '@/db/queries/notification'
import { cn } from '@/lib/utils'

interface NotificationListProps extends React.ComponentProps<'div'> {
  notifications: Notification[]
  onNavigate?: () => void
  onRead?: (id: number) => void
}

export const NotificationList = ({ className, notifications, onNavigate, onRead, ...props }: NotificationListProps) => {
  const t = useTranslations('Notifications')
  const format = useFormatter()
  const [now] = useState(() => new Date())
  const groups = groupByDay(notifications, now)

  const label = (group: (typeof groups)[number]) => {
    if (group.kind === 'today') return t('today')
    if (group.kind === 'yesterday') return t('yesterday')
    return format.dateTime(group.date, { dateStyle: 'medium' })
  }

  return (
    <div className={cn('space-y-4', className)} {...props}>
      {groups.map(group => (
        <section key={group.key}>
          <h3 className="px-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label(group)}
          </h3>
          <ul className="space-y-0.5">
            {group.items.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                now={now}
                onNavigate={onNavigate}
                onRead={onRead}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
