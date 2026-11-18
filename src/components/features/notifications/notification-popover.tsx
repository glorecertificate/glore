'use client'

import { useRef, useState } from 'react'

import { useTranslations } from 'next-intl'

import { listNotifications, markAllNotificationsRead } from '@/actions/notifications/inbox'
import { NotificationList } from '@/components/features/notifications/notification-list'
import { LucideIcon } from '@/components/icons/lucide'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { toast } from '@/components/ui/toast'
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

  const latest = useRef(0)

  const readLatest = async () => {
    latest.current += 1
    const request = latest.current
    try {
      const { data: page, error } = await listNotifications({ limit: POPOVER_LIMIT })
      if (error) throw new Error(error.message)
      if (request === latest.current) setFailed(false)
      return page
    } catch (error) {
      if (request === latest.current) setFailed(true)
      throw error
    }
  }

  const { data, refresh } = usePoll(readLatest, { interval: 30_000 })

  const reload = () => {
    refresh()
    onChange()
  }

  const markAll = async () => {
    try {
      const { error } = await markAllNotificationsRead()
      if (error) {
        toast.error(t('markAllFailed'))
        return
      }
      reload()
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
        {data === null && !failed && <LoadingFallback className="py-10" />}
        {failed && (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <LucideIcon className="size-6 text-muted-foreground" name="triangle-alert" />
            <p className="type-label">{t('errorTitle')}</p>
            <Button onClick={refresh} size="sm" variant="outline">
              {t('retry')}
            </Button>
          </div>
        )}
        {data && !failed && data.items.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <LucideIcon className="size-6 text-muted-foreground" name="bell-off" />
            <p className="type-label">{t('emptyTitle')}</p>
            <p className="text-[13px] text-muted-foreground">{t('emptyDescription')}</p>
          </div>
        )}
        {data && !failed && data.items.length > 0 && (
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
