'use client'

import { type Route } from 'next'

import { useFormatter, useTranslations } from 'next-intl'

import { type TutorQueueItem, type TutorSummary } from '@/actions/dashboard/core'
import { AgeBadge } from '@/components/features/certificates/age-badge'
import { DashboardEmpty } from '@/components/features/dashboard/empty'
import { DashboardHero } from '@/components/features/dashboard/hero'
import { DashboardSection, StatLink } from '@/components/features/dashboard/section'
import { NotificationList } from '@/components/features/notifications/notification-list'
import { LucideIcon } from '@/components/icons/lucide'
import { Badge } from '@/components/ui/badge'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Link } from '@/components/ui/link'
import { type Notification } from '@/db/queries/notification'

const HOURS_PER_DAY = 24

export const TutorDashboard = ({
  firstName,
  notifications,
  organization,
  tutor,
}: {
  firstName: string
  notifications: Notification[]
  organization: string | null
  tutor: TutorSummary
}) => {
  const t = useTranslations('Dashboard')
  const { number } = useFormatter()
  const { assigned, oldest, pool, queue, reviewTime, waitingVolunteer } = tutor

  const heroAction = (() => {
    if (assigned.count > 0) return { href: '/certificates?tab=assigned' as Route, label: t('tutor.openQueue') }
    if (pool.count > 0) return { href: '/certificates?tab=pool' as Route, label: t('tutor.openPool') }
    return { href: '/certificates' as Route, label: t('tutor.openQueue') }
  })()

  const reviewValue =
    reviewTime.averageHours === null
      ? t('tutor.noReviewTime')
      : reviewTime.averageHours >= HOURS_PER_DAY * 2
        ? t('tutor.reviewDays', { days: number(reviewTime.averageHours / HOURS_PER_DAY, { maximumFractionDigits: 1 }) })
        : t('tutor.reviewHours', { hours: number(reviewTime.averageHours, { maximumFractionDigits: 1 }) })

  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        action={heroAction}
        organization={organization}
        subtitle={t('subtitle.tutor')}
        title={t('greeting', { name: firstName })}
      />

      {oldest && (
        <Banner
          className="flex-wrap items-center justify-between"
          variant={oldest.tone === 'fresh' ? 'info' : 'warning'}
        >
          <div className="space-y-1">
            <p className="font-semibold">{t('tutor.oldestTitle')}</p>
            <p className="text-sm text-muted-foreground">
              {t(oldest.source === 'assigned' ? 'tutor.oldestAssigned' : 'tutor.oldestPool', {
                holder: oldest.holder ?? t('tutor.unknownVolunteer'),
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AgeBadge days={oldest.days} tone={oldest.tone} />
            <Button asChild size="sm" variant="brand">
              <Link
                href={
                  (oldest.source === 'assigned'
                    ? `/certificates/${oldest.id}/review`
                    : '/certificates?tab=pool') as Route
                }
              >
                {oldest.source === 'assigned' ? t('tutor.review') : t('tutor.claim')}
              </Link>
            </Button>
          </div>
        </Banner>
      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatLink
          accent="teal"
          description={t('tutor.assignedDescription')}
          href="/certificates?tab=assigned"
          icon="clipboard-check"
          label={t('tutor.assigned')}
          value={assigned.count}
        />
        <StatLink
          accent="navy"
          description={t('tutor.poolDescription')}
          href="/certificates?tab=pool"
          icon="inbox"
          label={t('tutor.pool')}
          value={pool.count}
        />
        <StatLink
          accent="amber"
          description={t('tutor.waitingVolunteerDescription')}
          href="/certificates?tab=assigned"
          icon="hourglass"
          label={t('tutor.waitingVolunteer')}
          value={waitingVolunteer}
        />
        <Card
          className="justify-between gap-4 border-transparent bg-highlight p-5 pt-6 text-highlight-foreground shadow-stat"
          data-slot="stat-card"
        >
          <CardHeader className="gap-2">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-highlight-foreground/15"
              >
                <LucideIcon className="size-4" name="timer" />
              </span>
              <CardDescription className="text-highlight-muted">{t('tutor.reviewTime')}</CardDescription>
            </div>
            <CardTitle className="type-stat">{reviewValue}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-highlight-muted">
            {reviewTime.sample > 0 ? t('tutor.reviewSample', { count: reviewTime.sample }) : t('tutor.reviewTimeEmpty')}
          </CardContent>
        </Card>
      </section>

      <DashboardSection action={{ href: '/certificates', label: t('viewAll') }} title={t('tutor.queueTitle')}>
        <DataTable
          columns={[
            {
              cell: (item: TutorQueueItem) => (
                <span className="font-medium">{item.holder ?? t('tutor.unknownVolunteer')}</span>
              ),
              header: t('tutor.volunteer'),
              id: 'holder',
              sortValue: item => item.holder ?? '',
            },
            {
              cell: item => (
                <Badge variant={item.source === 'assigned' ? 'info' : 'muted'}>
                  {item.source === 'assigned' ? t('tutor.sourceAssigned') : t('tutor.sourcePool')}
                </Badge>
              ),
              header: t('tutor.source'),
              id: 'source',
              sortValue: item => item.source,
            },
            {
              cell: item => <AgeBadge days={item.days} tone={item.tone} />,
              header: t('tutor.waiting'),
              id: 'waiting',
              sortValue: item => item.days,
            },
          ]}
          emptyDescription={t('tutor.queueEmptyDescription')}
          emptyTitle={t('tutor.queueEmptyTitle')}
          getRowId={item => `${item.source}-${item.id}`}
          label={t('tutor.queueTitle')}
          pageSize={5}
          rowActions={item =>
            item.source === 'assigned' ? (
              <Button asChild icon="clipboard-check" size="sm" variant="brand">
                <Link href={`/certificates/${item.id}/review`}>{t('tutor.review')}</Link>
              </Button>
            ) : (
              <Button asChild icon="user-plus" size="sm" variant="outline">
                <Link href="/certificates?tab=pool">{t('tutor.claim')}</Link>
              </Button>
            )
          }
          rows={queue}
        />
      </DashboardSection>

      <DashboardSection action={{ href: '/notifications', label: t('viewAll') }} title={t('updates.title')}>
        <Card>
          <CardContent>
            {notifications.length === 0 ? (
              <DashboardEmpty icon="bell-off" title={t('updates.empty')} />
            ) : (
              <NotificationList notifications={notifications} />
            )}
          </CardContent>
        </Card>
      </DashboardSection>
    </div>
  )
}
