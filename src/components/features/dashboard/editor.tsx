'use client'

import { useFormatter, useTranslations } from 'next-intl'

import { type EditorSummary } from '@/actions/dashboard/core'
import { DashboardEmpty } from '@/components/features/dashboard/empty'
import { DashboardHero } from '@/components/features/dashboard/hero'
import { StatLink } from '@/components/features/dashboard/section'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Chart } from '@/components/ui/chart'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { LOCALES } from '@/lib/i18n'

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
  const tIntl = useTranslations('Intl.Languages')
  const { dateTime } = useFormatter()
  const { engagement, health, stats, top, translations } = editor
  const hasEngagement = engagement.some(({ completed, started }) => started + completed > 0)

  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        action={{ href: '/courses', label: t('editor.openCourses') }}
        organization={organization}
        subtitle={t('subtitle.editor')}
        title={t('greeting', { name: firstName })}
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('editor.translationsTitle')}</CardTitle>
            <CardDescription>{t('editor.translationsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-4">
              {LOCALES.map(locale => {
                const complete = health.total - health.gaps[locale]
                const coverage = translations.find(item => item.locale === locale)
                return (
                  <li className="flex flex-col gap-1.5" key={locale}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{tIntl(locale)}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {t('editor.translationsCount', { complete, total: health.total })}
                      </span>
                    </div>
                    <Progress
                      aria-label={tIntl(locale)}
                      color={health.gaps[locale] === 0 ? 'success' : 'brand'}
                      value={health.total > 0 ? (complete / health.total) * 100 : 0}
                    />
                    {coverage && (
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {t('editor.translationsReviewed', {
                          reviewed: coverage.reviewed,
                          total: coverage.total,
                          translated: coverage.translated,
                        })}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('editor.healthTitle')}</CardTitle>
            {health.attention.length > 0 && <CardDescription>{t('editor.healthDescription')}</CardDescription>}
          </CardHeader>
          <CardContent>
            {health.attention.length === 0 && <DashboardEmpty icon="circle-check" title={t('editor.healthClear')} />}
            {health.attention.length > 0 && (
              <ul className="divide-y">
                {health.attention.map(course => (
                  <li className="flex flex-wrap items-center gap-2 py-3 first:pt-0 last:pb-0" key={course.slug}>
                    <Link
                      className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                      href={`/courses/${course.slug}`}
                    >
                      {course.title}
                    </Link>
                    {course.issues.map(issue => (
                      <Badge key={issue} variant="warning">
                        {t(`editor.issue.${issue}`)}
                      </Badge>
                    ))}
                    {course.missing.map(locale => (
                      <Badge key={locale} variant="outline">
                        {t('editor.missing', { language: locale.toUpperCase() })}
                      </Badge>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
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
