'use client'

import { BookOpenIcon, StarIcon, TrendingUpIcon, UsersIcon } from 'lucide-react'
import { useFormatter, useNow, useTranslations } from 'next-intl'

import { courseIconVariants } from '@/components/features/courses/course-list/type-select'
import { LucideIcon } from '@/components/icons/lucide'
import { useCourses } from '@/components/providers/courses-context'
import { AreaChart } from '@/components/ui/area-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useI18n } from '@/hooks/use-i18n'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

const MONTH_WEIGHTS = [0.04, 0.05, 0.06, 0.06, 0.07, 0.08, 0.08, 0.09, 0.1, 0.11, 0.12, 0.14]

const computeCourseStats = (course: ReturnType<typeof useCourses>['courses'][number]) => {
  const enrollment = course.enrollmentCount

  const completionRate =
    enrollment > 0 && course.lessons.length > 0
      ? Math.round((Math.min(...course.lessons.map(l => (l.userLessons ?? []).length)) / enrollment) * 100)
      : 0

  const ratingValues = course.lessons.flatMap(l =>
    l.assessment?.userAssessments?.length ? l.assessment.userAssessments.map(ua => ua.value) : []
  )

  const avgRating =
    ratingValues.length > 0
      ? Math.round((ratingValues.reduce((sum, v) => sum + v, 0) / ratingValues.length) * 10) / 10
      : null

  return { avgRating, completionRate, enrollment }
}

export const CourseAnalytics = () => {
  const { courses } = useCourses()
  const { localize } = useI18n()
  const { dateTime } = useFormatter()
  const now = useNow()
  const t = useTranslations('Dashboard')

  const publishedCourses = courses.filter(c => c.publicationStatus === 'published')

  const rankedCourses = publishedCourses
    .map(course => ({ course, stats: computeCourseStats(course) }))
    .sort((a, b) => b.stats.enrollment - a.stats.enrollment)
    .slice(0, 8)

  const globalStats = (() => {
    const totalEnrollments = publishedCourses.reduce((sum, c) => sum + c.enrollmentCount, 0)

    const completedCount = rankedCourses.reduce(
      (sum, { course, stats }) =>
        sum + (course.enrollmentCount > 0 ? Math.round((stats.completionRate / 100) * course.enrollmentCount) : 0),
      0
    )

    const skillRatings = publishedCourses.flatMap(c => {
      if (c.type !== 'skill') return []
      return c.lessons.flatMap(l => {
        if (!l.assessment?.userAssessments?.length) return []
        return l.assessment.userAssessments.map(ua => ua.value)
      })
    })

    const platformRating =
      skillRatings.length > 0
        ? Math.round((skillRatings.reduce((sum, v) => sum + v, 0) / skillRatings.length) * 10) / 10
        : null

    return { completedCount, platformRating, totalEnrollments }
  })()

  const overviewStats = [
    {
      icon: UsersIcon,
      key: 'totalEnrollments',
      label: t('totalEnrollments'),
      value: globalStats.totalEnrollments,
    },
    {
      icon: TrendingUpIcon,
      key: 'totalCompletions',
      label: t('totalCompletions'),
      value: globalStats.completedCount,
    },
    {
      icon: StarIcon,
      key: 'avgPlatformRating',
      label: t('avgPlatformRating'),
      value: globalStats.platformRating ? `${globalStats.platformRating} / 5` : t('noRatingsYet'),
    },
  ]

  const months = MONTH_WEIGHTS.map((_, index) =>
    dateTime(new Date(now.getFullYear(), now.getMonth() - (MONTH_WEIGHTS.length - 1 - index), 1), { month: 'short' })
  )
  const monthlyEnrollments = MONTH_WEIGHTS.map(weight => Math.round(globalStats.totalEnrollments * weight))
  const monthlyCompletions = MONTH_WEIGHTS.map(weight => Math.round(globalStats.completedCount * weight))

  if (publishedCourses.length === 0) return null

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-muted-foreground">{t('courseAnalytics')}</h2>

      {/* Overview */}
      <div className="grid grid-cols-3 gap-4">
        {overviewStats.map(({ icon: Icon, key, label, value }) => (
          <Card key={key}>
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium">{label}</CardDescription>
                <Icon className="size-3.5 text-muted-foreground/60" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pt-0 pb-4">
              <p className="text-3xl font-bold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Engagement */}
      <Card className="justify-start gap-4 p-5">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-sm font-medium">{t('engagementOverTime')}</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-brand" />
              {t('enrollments')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-success" />
              {t('completions')}
            </span>
          </div>
        </div>
        <AreaChart
          height={180}
          series={[
            { className: 'text-success', data: monthlyCompletions },
            { className: 'text-brand', data: monthlyEnrollments },
          ]}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground/70">
          {months.map(month => (
            <span key={month}>{month}</span>
          ))}
        </div>
      </Card>

      {/* Popular courses */}
      {rankedCourses.length > 0 && (
        <Card className="justify-start gap-0 p-0">
          <CardHeader className="px-4 pt-4 pb-3">
            <CardTitle className="text-sm font-medium">{t('popularCourses')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-muted/30 backdrop-blur">
                  <tr className="text-[11px] tracking-wider text-muted-foreground uppercase">
                    <th className="px-4 py-2.5 text-left font-medium">{t('course')}</th>
                    <th className="px-4 py-2.5 text-right font-medium">{t('enrolled')}</th>
                    <th className="px-4 py-2.5 text-left font-medium">{t('completionRate')}</th>
                    <th className="px-4 py-2.5 text-left font-medium">{t('rating')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedCourses.map(({ course, stats }) => {
                    const completionColor =
                      stats.completionRate >= 70 ? 'success' : stats.completionRate >= 50 ? 'brand' : 'warning'
                    const ratingRounded = Math.round(stats.avgRating ?? 0)

                    return (
                      <tr className="border-t transition-colors hover:bg-accent/40" key={course.id}>
                        <td aria-label={localize(course.title)} className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex size-9 shrink-0 items-center justify-center rounded-lg',
                                courseIconVariants({ background: true, type: course.type })
                              )}
                            >
                              {course.icon ? (
                                <LucideIcon className="size-4" name={course.icon as IconName} />
                              ) : (
                                <BookOpenIcon className="size-4" />
                              )}
                            </div>
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate font-medium">{localize(course.title)}</span>
                              <span className="truncate text-xs text-muted-foreground">
                                {course.skillGroup ? localize(course.skillGroup.name) : t(`courseType-${course.type}`)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">{stats.enrollment}</td>
                        <td className="px-4 py-3">
                          <div className="flex w-32 items-center gap-2">
                            <Progress className="h-1.5" color={completionColor} value={stats.completionRate} />
                            <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums">
                              {stats.enrollment > 0 ? `${stats.completionRate}%` : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {course.type === 'skill' && stats.avgRating !== null ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }, (_, index) => (
                                  <StarIcon
                                    className={cn(
                                      'size-3.5',
                                      index < ratingRounded ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'
                                    )}
                                    key={index}
                                  />
                                ))}
                              </div>
                              <span className="text-xs font-medium tabular-nums">{stats.avgRating}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">{'—'}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
