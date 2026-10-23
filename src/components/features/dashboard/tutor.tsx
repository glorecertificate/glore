'use client'

import { type Route } from 'next'

import { useFormatter, useTranslations } from 'next-intl'

import { type TutorQueueItem, type TutorSummary } from '@/actions/dashboard/core'
import { AgeBadge } from '@/components/features/certificates/age-badge'
import { DashboardHero } from '@/components/features/dashboard/hero'
import { DashboardSection, StatLink } from '@/components/features/dashboard/section'
import { NotificationList } from '@/components/features/notifications/notification-list'
import { Badge } from '@/components/ui/badge'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
    <div className="flex flex-col gap-8 pt-6 pb-10">
      <DashboardHero action={heroAction} name={firstName} organization={organization} subtitle={t('subtitle.tutor')} />

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
          description={t('tutor.assignedDescription')}
          href="/certificates?tab=assigned"
          label={t('tutor.assigned')}
          value={assigned.count}
        />
        <StatLink
          description={t('tutor.poolDescription')}
          href="/certificates?tab=pool"
          label={t('tutor.pool')}
          value={pool.count}
        />
        <StatLink
          description={t('tutor.waitingVolunteerDescription')}
          href="/certificates?tab=assigned"
          label={t('tutor.waitingVolunteer')}
          value={waitingVolunteer}
        />
        <Card data-slot="stat-card">
          <CardContent className="flex flex-col gap-1.5">
            <p className="text-sm text-muted-foreground">{t('tutor.reviewTime')}</p>
            <p className="font-display text-3xl font-semibold">{reviewValue}</p>
            <p className="text-sm text-muted-foreground">
              {reviewTime.sample > 0
                ? t('tutor.reviewSample', { count: reviewTime.sample })
                : t('tutor.reviewTimeEmpty')}
            </p>
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
              <p className="text-sm text-muted-foreground">{t('updates.empty')}</p>
            ) : (
              <NotificationList notifications={notifications} />
            )}
          </CardContent>
        </Card>
      </DashboardSection>
    </div>
  )
}
