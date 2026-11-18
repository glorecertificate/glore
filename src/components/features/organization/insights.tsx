'use client'

import { useEffect, useState } from 'react'

import { useFormatter, useTranslations } from 'next-intl'

import { type OrganizationInsights, getOrganizationInsights } from '@/actions/organizations/insights'
import { LucideIcon } from '@/components/icons/lucide'
import { LoadingFallback } from '@/components/layout/loading-fallback'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chart } from '@/components/ui/chart'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Progress } from '@/components/ui/progress'
import { StatCard } from '@/components/ui/stat-card'
import { RATING_MIN_COUNT } from '@/db/queries/organization-insights'
import { useReveal } from '@/hooks/use-reveal'
import { cn } from '@/lib/utils'

import { type InsightsScope, createInsightsCache } from './insights-cache'
import { TabHeader } from './tab-header'

const HOURS_PER_DAY = 24

const insightsCache = createInsightsCache<OrganizationInsights>(async organizationId => {
  const { data } = await getOrganizationInsights(organizationId)
  return data
})

const readPrefetched = (organizationId?: number, viewerId?: string) =>
  organizationId === undefined || viewerId === undefined
    ? null
    : insightsCache.read({ organizationId, userId: viewerId })

const loadInsights = async (organizationId?: number, viewerId?: string) => {
  if (organizationId === undefined || viewerId === undefined) {
    const { data } = await getOrganizationInsights(organizationId)
    return data
  }
  const scope = { organizationId, userId: viewerId }
  await insightsCache.prefetch(scope)
  return insightsCache.read(scope)
}

export const prefetchInsights = (scope: InsightsScope) => insightsCache.prefetch(scope)

export const OrganizationInsightsPanel = ({
  organizationId,
  viewerId,
}: {
  organizationId?: number
  viewerId?: string
}) => {
  const [attempt, setAttempt] = useState(0)

  return (
    <InsightsContent
      key={attempt}
      onRetry={() => setAttempt(current => current + 1)}
      organizationId={organizationId}
      viewerId={viewerId}
    />
  )
}

const InsightsContent = ({
  onRetry,
  organizationId,
  viewerId,
}: {
  onRetry: () => void
  organizationId?: number
  viewerId?: string
}) => {
  const t = useTranslations('Organization')
  const [insights, setInsights] = useState<OrganizationInsights | null>(() => readPrefetched(organizationId))
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (insights) return
    let active = true
    const load = async () => {
      const data = await loadInsights(organizationId, viewerId)
      if (!active) return
      setFailed(!data)
      setInsights(data)
    }
    load()
    return () => {
      active = false
    }
  }, [insights, organizationId, viewerId])

  if (failed) {
    return (
      <div className="flex flex-col gap-6">
        <TabHeader description={t('insightsDescription')} title={t('insights')} />
        <Banner className="items-center justify-between" role="alert" variant="destructive">
          {t('insightsError')}
          <Button onClick={onRetry} size="sm" type="button" variant="outline">
            {t('retry')}
          </Button>
        </Banner>
      </div>
    )
  }

  if (!insights) return <InsightsView insights={PLACEHOLDER_INSIGHTS} loading />

  return <InsightsView insights={insights} />
}

const PLACEHOLDER_INSIGHTS: OrganizationInsights = {
  learning: { completedCourses: 0, completedPeople: 0, people: 0, startedPeople: 0 },
  monthly: [],
  rating: { count: 0, ready: false },
  review: { averageHours: 1, sample: 1 },
  tutors: [],
}

const InsightsView = ({ insights, loading = false }: { insights: OrganizationInsights; loading?: boolean }) => {
  const { dateTime, number } = useFormatter()
  const t = useTranslations('Organization')
  const reveal = useReveal(loading)
  const { learning, monthly, rating, review, tutors } = insights
  const approvedTotal = monthly.reduce((sum, row) => sum + row.approved, 0)
  const hasMonthlyData = monthly.some(row => row.approved > 0 || row.submitted > 0)
  const chartData = monthly.map(row => {
    const [year = 0, month = 1] = row.month.split('-').map(Number)
    return {
      approved: row.approved,
      id: row.month,
      label: dateTime(new Date(Date.UTC(year, month - 1, 1)), { month: 'short', timeZone: 'UTC', year: '2-digit' }),
      submitted: row.submitted,
    }
  })

  return (
    <div aria-busy={loading || undefined} className={cn('flex flex-col gap-6', reveal && 'animate-reveal')}>
      {loading && <LoadingFallback className="sr-only" spinner={false} />}
      <TabHeader description={t('insightsDescription')} title={t('insights')} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          accent="teal"
          description={t('insightsLearningOf', { people: learning.people })}
          icon="play"
          label={t('insightsStarted')}
          loading={loading}
          value={learning.startedPeople}
        />
        <StatCard
          accent="green"
          description={t('insightsCoursesCompleted', { count: learning.completedCourses })}
          icon="graduation-cap"
          label={t('insightsCompleted')}
          loading={loading}
          value={learning.completedPeople}
        />
        <StatCard
          accent="amber"
          description={
            review.averageHours === null ? t('insightsReviewNone') : t('insightsReviewSample', { count: review.sample })
          }
          format={{ maximumFractionDigits: 1 }}
          icon="timer"
          label={t('insightsReviewTime')}
          loading={loading}
          value={review.averageHours === null ? 0 : review.averageHours / HOURS_PER_DAY}
        />
        <StatCard
          accent="navy"
          description={t('insightsApprovedRange')}
          icon="award"
          label={t('insightsApproved')}
          loading={loading}
          value={approvedTotal}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('insightsMonthlyTitle')}</CardTitle>
          <CardDescription>{t('insightsMonthlyDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!(loading || hasMonthlyData) && (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LucideIcon name="chart-no-axes-column" />
                </EmptyMedia>
                <EmptyTitle>{t('insightsMonthlyEmpty')}</EmptyTitle>
                <EmptyDescription>{t('insightsMonthlyEmptyDescription')}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {(loading || hasMonthlyData) && (
            <Chart
              data={chartData}
              label={t('insightsMonthlyTitle')}
              loading={loading}
              series={[
                { key: 'submitted', label: t('insightsSubmitted') },
                { color: 'var(--chart-2)', key: 'approved', label: t('insightsApprovedSeries') },
              ]}
              variant="bar"
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('insightsTutorsTitle')}</CardTitle>
            <CardDescription>{t('insightsTutorsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && <LoadingFallback className="h-5" label={null} spinner={{ size: 'md' }} />}
            {!loading && tutors.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('insightsTutorsEmpty')}</p>
            )}
            <ul className="divide-y">
              {tutors.map(tutor => (
                <li
                  className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
                  key={tutor.tutorId}
                >
                  <span className="min-w-0 truncate font-medium">{tutor.name}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {t('insightsTutorLoad', { open: tutor.open, reviewed: tutor.reviewed })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('insightsRatingTitle')}</CardTitle>
            <CardDescription>{t('insightsRatingDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && <LoadingFallback className="h-5" label={null} spinner={{ size: 'md' }} />}
            {!loading && !rating.ready && (
              <p className="text-sm text-muted-foreground">
                {t('insightsRatingLocked', { count: rating.count, min: RATING_MIN_COUNT })}
              </p>
            )}
            {rating.ready && (
              <div className="space-y-4 text-sm">
                <ul className="space-y-4">
                  {(
                    [
                      ['insightsRatingExperience', rating.experience],
                      ['insightsRatingSupport', rating.support],
                      ['insightsRatingCertification', rating.certificationSupport],
                    ] as const
                  ).map(([key, value]) => (
                    <li className="space-y-1.5" key={key}>
                      <div className="flex items-center justify-between gap-3">
                        <span>{t(key)}</span>
                        <span className="font-medium tabular-nums">
                          {value === null
                            ? t('insightsRatingNone')
                            : t('insightsRatingValue', { value: number(value, { maximumFractionDigits: 1 }) })}
                        </span>
                      </div>
                      {value !== null && <Progress aria-label={t(key)} color="brand" value={(value / 5) * 100} />}
                    </li>
                  ))}
                  <li className="flex items-center justify-between gap-3">
                    <span>{t('insightsRatingRecommend')}</span>
                    <span className="font-medium tabular-nums">
                      {rating.recommendRate === null
                        ? t('insightsRatingNone')
                        : number(rating.recommendRate, { maximumFractionDigits: 0, style: 'percent' })}
                    </span>
                  </li>
                </ul>
                <p className="type-caption text-muted-foreground">
                  {t('insightsRatingCount', { count: rating.count })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
