'use client'

import { useTranslations } from 'next-intl'

import { listNotifications, markAllNotificationsRead } from '@/actions/notifications/inbox'
import { NotificationList } from '@/components/features/notifications/notification-list'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { Skeleton } from '@/components/ui/skeleton'
import { usePoll } from '@/hooks/use-poll'

const POPOVER_LIMIT = 10

const readLatest = async () => {
  const { data, error } = await listNotifications({ limit: POPOVER_LIMIT })
  if (error) throw new Error(error.message)
  return data
}

interface NotificationPopoverProps {
  onChange: () => void
  onNavigate: () => void
  unread: number
}

export const NotificationPopover = ({ onChange, onNavigate, unread }: NotificationPopoverProps) => {
  const t = useTranslations('Notifications')
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
        {data === null && (
          <div className="space-y-2 p-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {data && data.items.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <LucideIcon className="size-6 text-muted-foreground" name="bell-off" />
            <p className="text-sm font-medium">{t('emptyTitle')}</p>
            <p className="text-[13px] text-muted-foreground">{t('emptyDescription')}</p>
          </div>
        )}
        {data && data.items.length > 0 && (
          <NotificationList notifications={data.items} onNavigate={onNavigate} onRead={reload} />
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
