'use client'

import { useFormatter, useTranslations } from 'next-intl'

import { Timeline } from '@/components/ui/timeline'
import { TimelineItem } from '@/components/ui/timeline-item'
import { timestampMillis } from '@/db/queries/organization'
import { type ActivityItem, activityMessageKey } from '@/db/queries/organization-insights'
import { type MessageKey } from '@/lib/i18n'

export const ActivityList = ({ items, label }: { items: ActivityItem[]; label: string }) => {
  const { dateTime } = useFormatter()
  const t = useTranslations('Organization')

  const describe = (item: ActivityItem) => {
    const base = activityMessageKey(item.action) as MessageKey<'Organization'>
    const unnamed = `${base}_unnamed` as MessageKey<'Organization'>
    const key = !item.target && t.has(unnamed) ? unnamed : base
    const person = t('activityUnknownPerson')
    const message = t(t.has(key) ? key : 'activity_unknown', {
      actor: item.actor ?? person,
      previousRole: item.previousRole ? t(`role_${item.previousRole}`) : '',
      role: item.role ? t(`role_${item.role}`) : '',
      target: item.target ?? person,
      tutor: item.tutor ?? person,
    })
    return message.charAt(0).toLocaleUpperCase() + message.slice(1)
  }

  return (
    <Timeline aria-label={label}>
      {items.map(item => {
        const date = new Date(timestampMillis(item.createdAt))
        return (
          <TimelineItem
            dateTime={date.toISOString()}
            key={item.id}
            time={dateTime(date, { dateStyle: 'medium', timeStyle: 'short' })}
          >
            {describe(item)}
          </TimelineItem>
        )
      })}
    </Timeline>
  )
}
