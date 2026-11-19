'use client'

import { useTranslations } from 'next-intl'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chart } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'

export const InsightsSkeleton = () => {
  const t = useTranslations('Organization')

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[t('insightsStarted'), t('insightsCompleted'), t('insightsReviewTime'), t('insightsApproved')].map(label => (
          <StatCard description="" key={label} label={label} loading value={0} />
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('insightsMonthlyTitle')}</CardTitle>
          <CardDescription>{t('insightsMonthlyDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Chart data={[]} label={t('insightsMonthlyTitle')} loading series={[]} variant="bar" />
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {[
          [t('insightsTutorsTitle'), t('insightsTutorsDescription')],
          [t('insightsRatingTitle'), t('insightsRatingDescription')],
        ].map(([title, description]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-5 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
