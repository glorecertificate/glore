import { useFormatter, useTranslations } from 'next-intl'

import { AdminOverviewPipeline } from '@/components/features/admin/overview-pipeline'
import { AdminOverviewShortcuts } from '@/components/features/admin/overview-shortcuts'
import { hasMonthlyActivity, monthStart, toDuration } from '@/components/features/admin/overview-utils'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chart } from '@/components/ui/chart'
import { SkeletonText } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import { type AdminOverview as AdminOverviewData } from '@/db/queries/admin-overview'
import { PIPELINE_STATUSES, type Pipeline } from '@/db/queries/organization-insights'
import { cn } from '@/lib/utils'
import config from '~/config/app.json'

const OVERDUE_DAYS = Math.max(...config.reviewReminderDays)

export const AdminOverview = ({ loading = false, overview }: { loading?: boolean; overview: AdminOverviewData }) => {
  const t = useTranslations('Admin.overview')
  const { dateTime, number } = useFormatter()
  const { certificates, monthly, organizations, review, users } = overview

  const chartData = monthly.map(row => ({
    certificatesApproved: row.certificatesApproved,
    certificatesSubmitted: row.certificatesSubmitted,
    id: row.month,
    label: dateTime(monthStart(row.month), { month: 'short', timeZone: 'UTC', year: '2-digit' }),
    organizationsRegistered: row.organizationsRegistered,
    usersJoined: row.usersJoined,
  }))

  const growth = hasMonthlyActivity(monthly, ['usersJoined', 'organizationsRegistered'])
  const issuance = hasMonthlyActivity(monthly, ['certificatesSubmitted', 'certificatesApproved'])

  const duration = (hours: number) => {
    const { unit, value } = toDuration(hours)
    return number(value, { maximumFractionDigits: 1, style: 'unit', unit, unitDisplay: 'long' })
  }

  const peakHours = Math.max(...review.monthly.map(row => row.averageHours ?? 0))
  const reviewBars = peakHours
    ? review.monthly.map(row => ({
        height: Math.max(8, ((row.averageHours ?? 0) / peakHours) * 100),
        month: row.month,
        peak: row.averageHours === peakHours,
      }))
    : []

  const placeholder = (value: React.ReactNode) => (loading ? <SkeletonText>{value}</SkeletonText> : value)

  return (
    <div aria-busy={loading || undefined} className="flex min-w-0 flex-col gap-5">
      {loading && <LoadingFallback className="sr-only" spinner={false} />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          accent="teal"
          description={t('usersBreakdown', { admins: users.admins, banned: users.banned, pending: users.pending })}
          icon="user-round"
          label={t('statUsers')}
          loading={loading}
          value={users.total}
        />
        <StatCard
          accent="navy"
          description={t('organizationsBreakdown', {
            active: organizations.active,
            pending: organizations.pending,
            rejected: organizations.rejected,
          })}
          icon="building-2"
          label={t('statOrganizations')}
          loading={loading}
          value={organizations.total}
        />
        <StatCard
          accent="green"
          description={t('certificatesBreakdown', { drafts: certificates.drafts })}
          icon="award"
          label={t('statCertificates')}
          loading={loading}
          value={certificates.total}
        />
        <StatCard
          accent="amber"
          description={
            review.overdue > 0 ? t('waitingOverdue', { count: review.overdue, days: OVERDUE_DAYS }) : t('waitingOnTime')
          }
          icon="clock"
          label={t('statWaiting')}
          loading={loading}
          value={review.waiting}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('growthTitle')}</CardTitle>
            <CardDescription>{t('growthDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart
              data={growth ? chartData : []}
              label={t('growthTitle')}
              loading={loading}
              series={[
                { key: 'usersJoined', label: t('seriesUsers') },
                { color: 'var(--chart-2)', key: 'organizationsRegistered', label: t('seriesOrganizations') },
              ]}
              variant="line"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('certificatesChartTitle')}</CardTitle>
            <CardDescription>{t('certificatesChartDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart
              data={issuance ? chartData : []}
              label={t('certificatesChartTitle')}
              loading={loading}
              series={[
                { key: 'certificatesSubmitted', label: t('seriesSubmitted') },
                { color: 'var(--chart-2)', key: 'certificatesApproved', label: t('seriesApproved') },
              ]}
              variant="bar"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <AdminOverviewPipeline loading={loading} pipeline={certificates.pipeline} total={certificates.total} />
        <Card className="border-transparent bg-highlight text-highlight-foreground shadow-stat">
          <CardHeader>
            <CardTitle>{t('reviewTitle')}</CardTitle>
            <CardDescription className="text-highlight-muted">
              {placeholder(review.sample > 0 ? t('reviewSample', { count: review.sample }) : t('reviewNone'))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {review.averageHours !== null && review.medianHours !== null && (
              <dl className="flex gap-8">
                <div className="flex flex-col gap-1">
                  <dt className="type-caption text-highlight-muted">{t('reviewAverage')}</dt>
                  <dd className="type-title tabular-nums">{placeholder(duration(review.averageHours))}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="type-caption text-highlight-muted">{t('reviewMedian')}</dt>
                  <dd className="type-title tabular-nums">{placeholder(duration(review.medianHours))}</dd>
                </div>
              </dl>
            )}
            {reviewBars.length > 0 && (
              <div aria-hidden className="mt-6 flex h-14 items-end gap-1.5">
                {reviewBars.map(({ height, month, peak }) => (
                  <span
                    className={cn('flex-1 rounded-sm', peak ? 'bg-band-action' : 'bg-highlight-foreground/30')}
                    key={month}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <AdminOverviewShortcuts pendingOrganizations={organizations.pending} waitingCertificates={review.waiting} />
      </div>
    </div>
  )
}

const PLACEHOLDER_PIPELINE = Object.fromEntries(PIPELINE_STATUSES.map(status => [status, 0])) as Pipeline

const PLACEHOLDER_OVERVIEW: AdminOverviewData = {
  certificates: { drafts: 0, pipeline: PLACEHOLDER_PIPELINE, total: 1 },
  generatedAt: '',
  monthly: [],
  organizations: { active: 0, pending: 0, rejected: 0, total: 0 },
  review: { averageHours: 1, medianHours: 1, monthly: [], overdue: 0, sample: 1, waiting: 0 },
  users: { admins: 0, banned: 0, editors: 0, pending: 0, total: 0 },
}

export const AdminOverviewSkeleton = () => <AdminOverview loading overview={PLACEHOLDER_OVERVIEW} />
