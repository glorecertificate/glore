'use client'

import { useEffect } from 'react'

import { useTranslations } from 'next-intl'

import { markAllNotificationsRead } from '@/actions/notifications/inbox'
import { announceNotificationsChanged } from '@/components/features/notifications/events'
import { NotificationList } from '@/components/features/notifications/notification-list'
import { loadNotificationPage, useNotificationPage } from '@/components/features/notifications/use-notification-page'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'

const POLL_INTERVAL = 30_000

const NotificationSkeleton = ({ label }: { label: string }) => (
  <output className="block">
    <span className="sr-only">{label}</span>
    <ul aria-hidden className="space-y-0.5">
      {Array.from({ length: 4 }, (_, index) => (
        <li className="flex items-start gap-3 px-3 py-2.5" key={index}>
          <Skeleton className="mt-0.5 size-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </li>
      ))}
    </ul>
  </output>
)

const refresh = () => void loadNotificationPage({ force: true })

interface NotificationPopoverProps {
  onNavigate: () => void
  unread: number
}

export const NotificationPopover = ({ onNavigate, unread }: NotificationPopoverProps) => {
  const t = useTranslations('Notifications')
  const tCommon = useTranslations('Common')
  const { data, failed } = useNotificationPage()

  useEffect(() => {
    void loadNotificationPage()
    const tick = () => {
      if (document.visibilityState === 'visible') void loadNotificationPage({ force: true })
    }
    const timer = setInterval(tick, POLL_INTERVAL)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  const markAll = async () => {
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
    }
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
        {data === null && !failed && <NotificationSkeleton label={tCommon('loading')} />}
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
            onRead={refresh}
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
