'use client'

import { useFormatter, useTranslations } from 'next-intl'

import { type EditorSummary } from '@/actions/dashboard/core'
import { ContentHealth } from '@/components/features/dashboard/content-health'
import { DashboardEmpty } from '@/components/features/dashboard/empty'
import { DashboardHero } from '@/components/features/dashboard/hero'
import { StatLink } from '@/components/features/dashboard/section'
import { TranslationGaps } from '@/components/features/dashboard/translation-gaps'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chart } from '@/components/ui/chart'

export const EditorDashboard = ({
  editor,
  firstName,
  organization,
}: {
  editor: EditorSummary
  firstName: string
  organization: string | null
}) => {
  const t = useTranslations('Dashboard')
  const { dateTime } = useFormatter()
  const { engagement, gaps, health, stats, top } = editor
  const hasEngagement = engagement.some(({ completed, started }) => started + completed > 0)

  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        action={{ href: '/courses', label: t('editor.openCourses') }}
        organization={organization}
        subtitle={t('subtitle.editor')}
        title={t('greeting', { name: firstName })}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatLink
          accent="teal"
          description={t('editor.coursesDescription')}
          href="/courses"
          icon="book-open"
          label={t('editor.courses')}
          value={health.total}
        />
        <StatLink
          accent="green"
          description={t('editor.publishedDescription', { partial: health.states.partial, draft: health.states.draft })}
          href="/courses"
          icon="circle-check"
          label={t('editor.published')}
          value={health.states.published}
        />
        <StatLink
          accent="navy"
          description={t('editor.completionDescription')}
          format={{ maximumFractionDigits: 0, style: 'percent' }}
          href="/courses"
          icon="trending-up"
          label={t('editor.completion')}
          value={(stats.completionRate ?? 0) / 100}
        />
        <StatLink
          accent="amber"
          description={
            stats.ratings > 0 ? t('editor.ratingsDescription', { count: stats.ratings }) : t('editor.ratingsEmpty')
          }
          format={{ maximumFractionDigits: 1 }}
          href="/courses"
          icon="star"
          label={t('editor.rating')}
          value={stats.averageRating ?? 0}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ContentHealth health={health} />

        <TranslationGaps gaps={gaps} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('editor.engagementTitle')}</CardTitle>
            <CardDescription>{t('editor.engagementDescription', { count: stats.enrollments })}</CardDescription>
          </CardHeader>
          <CardContent>
            {hasEngagement ? (
              <Chart
                data={engagement.map(point => ({
                  completed: point.completed,
                  id: point.month,
                  label: dateTime(new Date(`${point.month}-01T00:00:00Z`), { month: 'short', timeZone: 'UTC' }),
                  started: point.started,
                }))}
                label={t('editor.engagementTitle')}
                series={[
                  { key: 'started', label: t('editor.started') },
                  { key: 'completed', label: t('editor.completed') },
                ]}
                variant="area"
              />
            ) : (
              <DashboardEmpty icon="chart-line" title={t('editor.engagementEmpty')} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('editor.topTitle')}</CardTitle>
            <CardDescription>{t('editor.topDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            {top.length > 0 ? (
              <Chart
                categorical
                data={top.map(course => ({
                  completions: course.completions,
                  enrollments: course.enrollments,
                  id: course.id,
                  label: course.title,
                }))}
                label={t('editor.topTitle')}
                series={[
                  { key: 'enrollments', label: t('editor.enrollments') },
                  { key: 'completions', label: t('editor.completions') },
                ]}
                variant="bar"
              />
            ) : (
              <DashboardEmpty icon="chart-bar" title={t('editor.topEmpty')} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
