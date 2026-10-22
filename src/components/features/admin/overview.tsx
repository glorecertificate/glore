import { useFormatter, useTranslations } from 'next-intl'

import { AdminOverviewPipeline } from '@/components/features/admin/overview-pipeline'
import { AdminOverviewShortcuts } from '@/components/features/admin/overview-shortcuts'
import { hasMonthlyActivity, monthStart, toDuration } from '@/components/features/admin/overview-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chart } from '@/components/ui/chart'
import { StatCard } from '@/components/ui/stat-card'
import { type AdminOverview as AdminOverviewData } from '@/db/queries/admin-overview'
import config from '~/config/app.json'

const OVERDUE_DAYS = Math.max(...config.reviewReminderDays)

export const AdminOverview = ({ overview }: { overview: AdminOverviewData }) => {
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

  return (
    <div className="space-y-6 pb-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description={t('usersBreakdown', { admins: users.admins, banned: users.banned, pending: users.pending })}
          label={t('statUsers')}
          value={users.total}
        />
        <StatCard
          description={t('organizationsBreakdown', {
            active: organizations.active,
            pending: organizations.pending,
            rejected: organizations.rejected,
          })}
          label={t('statOrganizations')}
          value={organizations.total}
        />
        <StatCard
          description={t('certificatesBreakdown', { drafts: certificates.drafts })}
          label={t('statCertificates')}
          value={certificates.total}
        />
        <StatCard
          description={
            review.overdue > 0 ? t('waitingOverdue', { count: review.overdue, days: OVERDUE_DAYS }) : t('waitingOnTime')
          }
          label={t('statWaiting')}
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
        <AdminOverviewPipeline pipeline={certificates.pipeline} total={certificates.total} />
        <Card>
          <CardHeader>
            <CardTitle>{t('reviewTitle')}</CardTitle>
            <CardDescription>
              {review.sample > 0 ? t('reviewSample', { count: review.sample }) : t('reviewNone')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {review.averageHours !== null && review.medianHours !== null && (
              <dl className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt>{t('reviewAverage')}</dt>
                  <dd className="font-medium tabular-nums">{duration(review.averageHours)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>{t('reviewMedian')}</dt>
                  <dd className="font-medium tabular-nums">{duration(review.medianHours)}</dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>
        <AdminOverviewShortcuts pendingOrganizations={organizations.pending} waitingCertificates={review.waiting} />
      </div>
    </div>
  )
}
