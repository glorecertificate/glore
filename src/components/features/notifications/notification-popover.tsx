'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { listNotifications, markAllNotificationsRead } from '@/actions/notifications/inbox'
import { NotificationList } from '@/components/features/notifications/notification-list'
import { LucideIcon } from '@/components/icons/lucide'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { usePoll } from '@/hooks/use-poll'

const POPOVER_LIMIT = 10

interface NotificationPopoverProps {
  onChange: () => void
  onNavigate: () => void
  unread: number
}

export const NotificationPopover = ({ onChange, onNavigate, unread }: NotificationPopoverProps) => {
  const t = useTranslations('Notifications')
  const [failed, setFailed] = useState(false)

  const readLatest = async () => {
    try {
      const { data: page, error } = await listNotifications({ limit: POPOVER_LIMIT })
      setFailed(Boolean(error))
      if (error) throw new Error(error.message)
      return page
    } catch (error) {
      setFailed(true)
      throw error
    }
  }

  const { data, refresh } = usePoll(readLatest, { interval: 30_000 })

  const reload = () => {
    refresh()
    onChange()
  }

  const markAll = async () => {
    await markAllNotificationsRead()
    reload()
  }

  return (
    <div className="flex max-h-[min(32rem,var(--radix-popover-content-available-height))] flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{t('title')}</h2>
        <Button disabled={unread === 0} onClick={markAll} size="sm" variant="ghost">
          {t('markAllRead')}
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {data === null && !failed && <LoadingFallback className="py-10" />}
        {data === null && failed && (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <LucideIcon className="size-6 text-muted-foreground" name="triangle-alert" />
            <p className="type-label">{t('errorTitle')}</p>
            <Button onClick={refresh} size="sm" variant="outline">
              {t('retry')}
            </Button>
          </div>
        )}
        {data && data.items.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <LucideIcon className="size-6 text-muted-foreground" name="bell-off" />
            <p className="type-label">{t('emptyTitle')}</p>
            <p className="text-[13px] text-muted-foreground">{t('emptyDescription')}</p>
          </div>
        )}
        {data && data.items.length > 0 && (
          <NotificationList
            className="animate-reveal"
            notifications={data.items}
            onNavigate={onNavigate}
            onRead={reload}
          />
        )}
      </div>
      <div className="border-t p-2">
        <Button asChild className="w-full" size="sm" variant="ghost">
          <Link href="/notifications" onClick={onNavigate}>
            {t('viewAll')}
          </Link>
        </Button>
      </div>
    </div>
  )
}
