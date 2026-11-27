'use client'

import { startTransition, useRef, useState } from 'react'

import { useTranslations } from 'next-intl'
import { useQueryState } from 'nuqs'

import { listNotifications, markAllNotificationsRead } from '@/actions/notifications/inbox'
import { announceNotificationsChanged } from '@/components/features/notifications/events'
import { NotificationList } from '@/components/features/notifications/notification-list'
import {
  NOTIFICATION_FILTERS,
  PAGE_SIZE,
  notificationCategoryParser,
  notificationFilterParser,
  notificationLimitParser,
} from '@/components/features/notifications/params'
import { useUnreadCount } from '@/components/features/notifications/use-unread-count'
import { LucideIcon } from '@/components/icons/lucide'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { FilterBar } from '@/components/ui/filter-bar'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { SegmentedControlItem } from '@/components/ui/segmented-control-item'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
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
  const [failed, setFailed] = useState(false)
  const [marking, setMarking] = useState(false)
  const [retrying, setRetrying] = useState(false)

  const latest = useRef(0)
  const unread = useUnreadCount()

  const read = async () => {
    latest.current += 1
    const request = latest.current
    try {
      const { data, error } = await listNotifications({ category: category ?? undefined, filter, limit })
      if (error) throw new Error(error.message)
      if (request !== latest.current) return data
      setFailed(false)
      setRetrying(false)
      return data
    } catch (error) {
      if (request === latest.current) {
        setFailed(true)
        setRetrying(false)
      }
      throw error
    }
  }

  const { data, refresh } = usePoll(read, { interval: 60_000, key: `${filter}:${category}:${limit}` })
  const filtering = filter !== 'all' || category !== null
  const hasUnread = unread > 0

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
    } catch {
      toast.error(t('markAllFailed'))
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
    setRetrying(true)
    refresh()
  }

  return (
    <Card className="gap-4">
      <div className="flex items-center justify-between gap-x-4 gap-y-3 sm:flex-wrap">
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
        <Button
          className="shrink-0 max-sm:w-8 max-sm:px-0 max-sm:has-[>svg]:px-0"
          disabled={!hasUnread}
          icon="check-check"
          loading={marking}
          onClick={markAll}
          size="sm"
          variant="outline"
        >
          <span className="max-sm:sr-only">{t('markAllRead')}</span>
        </Button>
      </div>

      {data === null && !failed && <LoadingFallback className="py-16" />}

      {failed && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LucideIcon name="triangle-alert" />
            </EmptyMedia>
            <EmptyTitle>{t('errorTitle')}</EmptyTitle>
            <EmptyDescription>{t('errorDescription')}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button loading={retrying} onClick={retry} variant="outline">
              {t('retry')}
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {data && !failed && data.items.length === 0 && (
        <Empty>
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
            className="animate-reveal border-t border-border-subtle pt-4"
            notifications={data.items}
            onRead={refresh}
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
    </Card>
  )
}
