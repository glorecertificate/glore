'use client'

import { startTransition, useState } from 'react'

import { useTranslations } from 'next-intl'
import { useQueryState } from 'nuqs'

import { countUnreadNotifications, listNotifications, markAllNotificationsRead } from '@/actions/notifications/inbox'
import { announceNotificationsChanged } from '@/components/features/notifications/events'
import { NotificationList } from '@/components/features/notifications/notification-list'
import {
  NOTIFICATION_FILTERS,
  PAGE_SIZE,
  notificationCategoryParser,
  notificationFilterParser,
  notificationLimitParser,
} from '@/components/features/notifications/params'
import { LucideIcon } from '@/components/icons/lucide'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { FilterBar } from '@/components/ui/filter-bar'
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
} from '@/components/ui/page-header'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { SegmentedControlItem } from '@/components/ui/segmented-control-item'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { NOTIFICATION_CATEGORIES } from '@/db/queries/notification'
import { usePoll } from '@/hooks/use-poll'

const MAX_LIMIT = 200

const ALL_CATEGORIES = 'all'

const CATEGORY_OPTIONS = [ALL_CATEGORIES, ...NOTIFICATION_CATEGORIES] as const

const readUnread = async () => {
  const { data, error } = await countUnreadNotifications()
  if (error) throw new Error(error.message)
  return data
}

export const NotificationsContent = () => {
  const t = useTranslations('Notifications')
  const [filter, setFilter] = useQueryState('filter', { ...notificationFilterParser, startTransition })
  const [category, setCategory] = useQueryState('category', { ...notificationCategoryParser, startTransition })
  const [limit, setLimit] = useQueryState('limit', { ...notificationLimitParser, startTransition })
  const [failed, setFailed] = useState(false)
  const [marking, setMarking] = useState(false)

  const read = async () => {
    const { data, error } = await listNotifications({ category: category ?? undefined, filter, limit })
    setFailed(Boolean(error))
    if (error) throw new Error(error.message)
    return data
  }

  const { data, refresh } = usePoll(read, { interval: 60_000, key: `${filter}:${category}:${limit}` })
  const filtering = filter !== 'all' || category !== null
  const { data: unread, refresh: refreshUnread } = usePoll(readUnread, { interval: 60_000 })
  const hasUnread = (unread ?? 0) > 0

  const markAll = async () => {
    setMarking(true)
    try {
      const { error } = await markAllNotificationsRead()
      if (error) {
        toast.error(t('markAllFailed'))
        return
      }
      announceNotificationsChanged()
      refresh()
      refreshUnread()
    } finally {
      setMarking(false)
    }
  }

  const emptyTitle = (() => {
    if (category) return t('emptyFilteredTitle')
    return t(filter === 'unread' ? 'emptyUnreadTitle' : 'emptyTitle')
  })()

  const emptyDescription = (() => {
    if (category) return t('emptyFilteredDescription')
    return t(filter === 'unread' ? 'emptyUnreadDescription' : 'emptyDescription')
  })()

  const resetLimit = () => setLimit(null)

  const clearFilters = () => {
    void setFilter(null)
    void setCategory(null)
    void resetLimit()
  }

  const retry = () => {
    setFailed(false)
    refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <PageHeaderHeading>
          <PageHeaderTitle>{t('title')}</PageHeaderTitle>
          <PageHeaderDescription>{t('description')}</PageHeaderDescription>
        </PageHeaderHeading>
        <PageHeaderActions>
          <Button disabled={!hasUnread} loading={marking} onClick={markAll} size="sm" variant="outline">
            {t('markAllRead')}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <FilterBar active={filtering} onClear={clearFilters}>
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
        <Select
          onValueChange={value => {
            void setCategory(value === ALL_CATEGORIES ? null : (value as (typeof NOTIFICATION_CATEGORIES)[number]))
            void resetLimit()
          }}
          value={category ?? ALL_CATEGORIES}
        >
          <SelectTrigger aria-label={t('filterCategory')} className="w-auto gap-1.5" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map(value => (
              <SelectItem key={value} value={value}>
                {t(`category_${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterBar>

      {data === null && !failed && <LoadingFallback className="py-16" />}

      {failed && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LucideIcon name="triangle-alert" />
            </EmptyMedia>
            <EmptyTitle>{t('errorTitle')}</EmptyTitle>
            <EmptyDescription>{t('errorDescription')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={retry} variant="outline">
              {t('retry')}
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {data && !failed && data.items.length === 0 && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LucideIcon name="bell-off" />
            </EmptyMedia>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {data && !failed && data.items.length > 0 && (
        <>
          <NotificationList
            className="animate-reveal"
            notifications={data.items}
            onRead={() => {
              refresh()
              refreshUnread()
            }}
          />
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
