'use client'

import { type Route } from 'next'

import { useFormatter, useTranslations } from 'next-intl'

import { type TutorQueueItem, type TutorSummary } from '@/actions/dashboard/core'
import { AgeBadge } from '@/components/features/certificates/age-badge'
import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { DashboardEmpty } from '@/components/features/dashboard/empty'
import { DashboardHero } from '@/components/features/dashboard/hero'
import { NotificationList } from '@/components/features/notifications/notification-list'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { type Notification } from '@/db/queries/notification'

const HOURS_PER_DAY = 24
const MIN_REVIEW_SAMPLE = 5

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()

const reviewHref = (item: TutorQueueItem) => {
  if (item.source === 'pool') return '/certificates?tab=pool' as Route
  return (item.status === 'changes_requested' ? `/certificates/${item.id}` : `/certificates/${item.id}/review`) as Route
}

export const TutorDashboard = ({
  firstName,
  notifications,
  tutor,
}: {
  firstName: string
  notifications: Notification[]
  tutor: TutorSummary
}) => {
  const t = useTranslations('Dashboard')
  const tQueue = useTranslations('CertificateQueue')
  const { number } = useFormatter()
  const { assigned, oldest, pool, queue, reviewTime, waitingVolunteer } = tutor

  const average = (() => {
    if (reviewTime.averageHours === null || reviewTime.sample < MIN_REVIEW_SAMPLE) return null
    const days = reviewTime.averageHours >= HOURS_PER_DAY * 2
    return t('tutor.reviewBasis', {
      count: reviewTime.sample,
      value: days
        ? t('tutor.reviewDays', { days: number(reviewTime.averageHours / HOURS_PER_DAY, { maximumFractionDigits: 1 }) })
        : t('tutor.reviewHours', { hours: number(reviewTime.averageHours, { maximumFractionDigits: 1 }) }),
    })
  })()

  const action = oldest
    ? { href: reviewHref(oldest), label: t(oldest.source === 'assigned' ? 'tutor.startNext' : 'tutor.claimNext') }
    : undefined

  const rowLabel = (item: TutorQueueItem) => {
    if (item.source === 'pool') return t('tutor.claim')
    return t(item.status === 'changes_requested' ? 'tutor.view' : 'tutor.startReview')
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardHero
        action={action}
        subtitle={
          <div className="flex flex-col gap-1">
            <p>{t('tutor.workload', { assigned: assigned.count, pool: pool.count, waiting: waitingVolunteer })}</p>
            {average && <p className="text-sm">{average}</p>}
          </div>
        }
        title={t('greeting', { name: firstName })}
      />

      <Card data-slot="tutor-queue">
        <CardHeader>
          <CardTitle>{t('tutor.queueTitle')}</CardTitle>
          {queue.length > 0 && (
            <CardAction>
              <Link
                className="inline-flex min-h-8 items-center text-sm font-medium"
                href="/certificates"
                variant="primary"
              >
                {t('tutor.openQueue')}
              </Link>
            </CardAction>
          )}
        </CardHeader>
        {queue.length === 0 && (
          <DashboardEmpty
            description={t('tutor.queueEmptyDescription', { count: pool.count })}
            icon="inbox"
            title={t('tutor.queueEmptyTitle')}
          />
        )}
        {queue.length === 0 && pool.count > 0 && (
          <Button asChild className="self-center" variant="outline">
            <Link href="/certificates?tab=pool">{t('tutor.claimRequest')}</Link>
          </Button>
        )}
        {queue.length > 0 && (
          <ul className="-mx-5 flex flex-col divide-y divide-border-subtle border-t border-border-subtle">
            {queue.map(item => {
              const name = item.holder ?? t('tutor.unknownVolunteer')
              return (
                <li
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3 sm:flex-nowrap"
                  key={`${item.source}-${item.id}`}
                >
                  <Avatar className="size-9">
                    <AvatarFallback>{initials(name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                    <Link
                      className="min-w-0 truncate text-sm font-medium text-fg-title hover:underline focus-visible:focus-ring"
                      href={reviewHref(item)}
                    >
                      {name}
                    </Link>
                    <div className="flex items-center gap-3">
                      <CertificateStatusBadge status={item.status} />
                      {item.status === 'changes_requested' ? (
                        <span className="type-caption text-fg-2">
                          {item.days === 0 ? tQueue('ageToday') : tQueue('ageDays', { days: item.days })}
                        </span>
                      ) : (
                        <AgeBadge days={item.days} tone={item.tone} />
                      )}
                    </div>
                  </div>
                  <Button asChild className="max-sm:w-full" size="sm" variant="outline">
                    <Link href={reviewHref(item)}>{rowLabel(item)}</Link>
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card data-slot="tutor-updates">
        <CardHeader>
          <CardTitle>{t('updates.title')}</CardTitle>
          <CardAction>
            <Link
              className="inline-flex min-h-8 items-center text-sm font-medium"
              href="/notifications"
              variant="primary"
            >
              {t('updates.all')}
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <DashboardEmpty icon="bell-off" title={t('updates.empty')} />
          ) : (
            <NotificationList notifications={notifications} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
