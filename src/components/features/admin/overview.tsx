import { useFormatter, useTranslations } from 'next-intl'

import { type ContentHealth } from '@/actions/dashboard/core'
import { AdminOverviewDecisions } from '@/components/features/admin/overview-decisions'
import { AdminOverviewHealth } from '@/components/features/admin/overview-health'
import { AdminOverviewPipeline } from '@/components/features/admin/overview-pipeline'
import { hasMonthlyActivity, monthStart, toDuration } from '@/components/features/admin/overview-utils'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chart } from '@/components/ui/chart'
import { SkeletonText } from '@/components/ui/skeleton'
import { type AdminOverview as AdminOverviewData } from '@/db/queries/admin-overview'
import { PIPELINE_STATUSES, type Pipeline } from '@/db/queries/organization-insights'

export const AdminOverview = ({
  health = null,
  loading = false,
  overview,
}: {
  health?: ContentHealth | null
  loading?: boolean
  overview: AdminOverviewData
}) => {
  const t = useTranslations('Admin.overview')
  const { dateTime, number } = useFormatter()
  const { certificates, monthly, organizations, review, users } = overview

  const chartData = monthly.map(row => ({
    certificatesApproved: row.certificatesApproved,
    certificatesSubmitted: row.certificatesSubmitted,
    id: row.month,
    label: dateTime(monthStart(row.month), { month: 'short', timeZone: 'UTC' }),
  }))
  const issuance = hasMonthlyActivity(monthly, ['certificatesSubmitted', 'certificatesApproved'])

  const duration = (hours: number) => {
    const { unit, value } = toDuration(hours)
    return number(value, { maximumFractionDigits: 1, style: 'unit', unit, unitDisplay: 'long' })
  }

  const figures = [
    {
      caption: t('captionUsers', { admins: users.admins, banned: users.banned }),
      label: t('statUsers'),
      value: users.total,
    },
    {
      caption: t('captionOrganizations', { active: organizations.active, pending: organizations.pending }),
      label: t('statOrganizations'),
      value: organizations.total,
    },
    {
      caption:
        review.averageHours === null
          ? t('captionDrafts', { drafts: certificates.drafts })
          : t('captionReview', { duration: duration(review.averageHours) }),
      label: t('statCertificates'),
      value: certificates.total,
    },
    {
      caption: health
        ? t('captionCourses', { published: health.states.published })
        : t('captionCourses', { published: 0 }),
      label: t('statCourses'),
      value: health?.total ?? 0,
    },
  ]

  const text = (value: React.ReactNode) => (loading ? <SkeletonText>{value}</SkeletonText> : value)

  return (
    <div aria-busy={loading || undefined} className="flex min-w-0 flex-col gap-6">
      {loading && <LoadingFallback className="sr-only" spinner={false} />}
      <AdminOverviewDecisions loading={loading} overview={overview} />

      <Card className="gap-0 p-0" data-slot="admin-figures">
        <dl className="grid grid-cols-2 divide-border-subtle max-lg:divide-y lg:grid-cols-4 lg:divide-x">
          {figures.map(({ caption, label, value }) => (
            <div
              className="flex min-w-0 flex-col gap-1 p-5 max-lg:nth-[2n]:border-l max-lg:nth-[2n]:border-border-subtle"
              key={label}
            >
              <dt className="type-label text-fg-2 uppercase">{label}</dt>
              <dd className="type-stat tabular-nums">{text(number(value))}</dd>
              <dd className="truncate type-caption text-fg-2">{text(caption)}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <AdminOverviewPipeline loading={loading} pipeline={certificates.pipeline} total={certificates.total} />
        <Card>
          <CardHeader>
            <CardTitle>{t('certificatesChartTitle')}</CardTitle>
            <CardDescription>{t('certificatesChartDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="max-sm:overflow-x-auto">
            <Chart
              className="max-sm:min-w-lg"
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

      <AdminOverviewHealth health={loading ? null : health} />
    </div>
  )
}

const PLACEHOLDER_PIPELINE = Object.fromEntries(PIPELINE_STATUSES.map(status => [status, 0])) as Pipeline

const PLACEHOLDER_OVERVIEW: AdminOverviewData = {
  certificates: { drafts: 0, pipeline: PLACEHOLDER_PIPELINE, total: 1 },
  decisions: { oldestApplication: { createdAt: '2026-01-01 00:00:00', id: 0 }, teamInvitations: 1 },
  generatedAt: '',
  monthly: [],
  organizations: { active: 0, pending: 1, rejected: 0, total: 0 },
  review: { averageHours: 1, medianHours: 1, monthly: [], overdue: 1, sample: 1, waiting: 0 },
  users: { admins: 0, banned: 0, editors: 0, pending: 0, total: 0 },
}

export const AdminOverviewSkeleton = () => <AdminOverview loading overview={PLACEHOLDER_OVERVIEW} />
