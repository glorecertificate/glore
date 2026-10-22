'use client'

import { useEffect, useState } from 'react'

import { useFormatter, useTranslations } from 'next-intl'

import { type OrganizationInsights, getOrganizationInsights } from '@/actions/organizations/insights'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chart } from '@/components/ui/chart'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'
import { RATING_MIN_COUNT } from '@/db/queries/organization-insights'

const HOURS_PER_DAY = 24

export const OrganizationInsightsPanel = ({ organizationId }: { organizationId?: number }) => {
  const [attempt, setAttempt] = useState(0)

  return (
    <InsightsContent key={attempt} onRetry={() => setAttempt(current => current + 1)} organizationId={organizationId} />
  )
}

const InsightsContent = ({ onRetry, organizationId }: { onRetry: () => void; organizationId?: number }) => {
  const { dateTime, number } = useFormatter()
  const t = useTranslations('Organization')
  const [insights, setInsights] = useState<OrganizationInsights | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data } = await getOrganizationInsights(organizationId)
      if (!active) return
      setFailed(!data)
      setInsights(data)
    }
    load()
    return () => {
      active = false
    }
  }, [organizationId])

  if (failed) {
    return (
      <Banner className="items-center justify-between" role="alert" variant="destructive">
        {t('insightsError')}
        <Button onClick={onRetry} size="sm" type="button" variant="outline">
          {t('retry')}
        </Button>
      </Banner>
    )
  }

  if (!insights) {
    return (
      <div aria-busy className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map(index => (
            <Skeleton className="h-32 w-full" key={index} />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  const { learning, monthly, rating, review, tutors } = insights
  const approvedTotal = monthly.reduce((sum, row) => sum + row.approved, 0)
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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description={t('insightsLearningOf', { people: learning.people })}
          label={t('insightsStarted')}
          value={learning.startedPeople}
        />
        <StatCard
          description={t('insightsCoursesCompleted', { count: learning.completedCourses })}
          label={t('insightsCompleted')}
          value={learning.completedPeople}
        />
        <StatCard
          description={
            review.averageHours === null ? t('insightsReviewNone') : t('insightsReviewSample', { count: review.sample })
          }
          format={{ maximumFractionDigits: 1 }}
          label={t('insightsReviewTime')}
          value={review.averageHours === null ? 0 : review.averageHours / HOURS_PER_DAY}
        />
        <StatCard description={t('insightsApprovedRange')} label={t('insightsApproved')} value={approvedTotal} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('insightsMonthlyTitle')}</CardTitle>
          <CardDescription>{t('insightsMonthlyDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Chart
            data={chartData}
            label={t('insightsMonthlyTitle')}
            series={[
              { key: 'submitted', label: t('insightsSubmitted') },
              { color: 'var(--chart-2)', key: 'approved', label: t('insightsApprovedSeries') },
            ]}
            variant="bar"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('insightsTutorsTitle')}</CardTitle>
            <CardDescription>{t('insightsTutorsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {tutors.length === 0 && <p className="text-sm text-muted-foreground">{t('insightsTutorsEmpty')}</p>}
            <ul className="space-y-3">
              {tutors.map(tutor => (
                <li className="flex items-center justify-between gap-3 text-sm" key={tutor.tutorId}>
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
            {!rating.ready && (
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
                <p className="text-xs text-muted-foreground">{t('insightsRatingCount', { count: rating.count })}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
