'use client'

import { startTransition } from 'react'

import { useTranslations } from 'next-intl'
import { useQueryState } from 'nuqs'

import { listNotifications, markAllNotificationsRead } from '@/actions/notifications/inbox'
import { NotificationList } from '@/components/features/notifications/notification-list'
import {
  NOTIFICATION_FILTERS,
  PAGE_SIZE,
  notificationCategoryParser,
  notificationFilterParser,
  notificationLimitParser,
} from '@/components/features/notifications/params'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { SegmentedControlItem } from '@/components/ui/segmented-control-item'
import { Skeleton } from '@/components/ui/skeleton'
import { NOTIFICATION_CATEGORIES } from '@/db/queries/notification'
import { usePoll } from '@/hooks/use-poll'

const MAX_LIMIT = 200

const ALL_CATEGORIES = 'all'

const CATEGORY_OPTIONS = [ALL_CATEGORIES, ...NOTIFICATION_CATEGORIES] as const

export const NotificationsContent = () => {
  const t = useTranslations('Notifications')
  const [filter, setFilter] = useQueryState('filter', { ...notificationFilterParser, startTransition })
  const [category, setCategory] = useQueryState('category', { ...notificationCategoryParser, startTransition })
  const [limit, setLimit] = useQueryState('limit', { ...notificationLimitParser, startTransition })

  const read = async () => {
    const { data, error } = await listNotifications({ category: category ?? undefined, filter, limit })
    if (error) throw new Error(error.message)
    return data
  }

  const { data, refresh } = usePoll(read, { interval: 60_000, key: `${filter}:${category}:${limit}` })

  const markAll = async () => {
    await markAllNotificationsRead()
    refresh()
  }

  const resetLimit = () => setLimit(null)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            aria-label={t('filterStatus')}
            onValueChange={value => {
              void setFilter(value as (typeof NOTIFICATION_FILTERS)[number])
              void resetLimit()
            }}
            value={filter}
          >
            {NOTIFICATION_FILTERS.map(value => (
              <SegmentedControlItem key={value} value={value}>
                {t(`filter_${value}`)}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
          <SegmentedControl
            aria-label={t('filterCategory')}
            onValueChange={value => {
              void setCategory(value === ALL_CATEGORIES ? null : (value as (typeof NOTIFICATION_CATEGORIES)[number]))
              void resetLimit()
            }}
            value={category ?? ALL_CATEGORIES}
          >
            {CATEGORY_OPTIONS.map(value => (
              <SegmentedControlItem key={value} value={value}>
                {t(`category_${value}`)}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>
        <Button onClick={markAll} size="sm" variant="outline">
          {t('markAllRead')}
        </Button>
      </div>

      {data === null && (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {data && data.items.length === 0 && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LucideIcon name="bell-off" />
            </EmptyMedia>
            <EmptyTitle>{filter === 'unread' ? t('emptyUnreadTitle') : t('emptyTitle')}</EmptyTitle>
            <EmptyDescription>
              {filter === 'unread' ? t('emptyUnreadDescription') : t('emptyDescription')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {data && data.items.length > 0 && (
        <>
          <NotificationList notifications={data.items} onRead={refresh} />
          {data.hasMore && limit < MAX_LIMIT && (
            <div className="flex justify-center">
              <Button onClick={() => setLimit(limit + PAGE_SIZE)} variant="outline">
                {t('loadMore')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
