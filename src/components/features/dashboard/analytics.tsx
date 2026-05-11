'use client'

import { StarIcon, TrendingUpIcon, UsersIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { courseTypeVariants } from '@/components/features/courses/list/type-select'
import { LucideIcon } from '@/components/icons/lucide'
import { useCourses } from '@/components/providers/courses-context'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useI18n } from '@/hooks/use-i18n'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

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

  if (publishedCourses.length === 0) return null

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-muted-foreground">{t('courseAnalytics')}</h2>

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

      {rankedCourses.length > 0 && (
        <Card>
          <CardHeader className="px-4 pt-4 pb-3">
            <CardTitle className="text-sm font-medium">{t('popularCourses')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {rankedCourses.map(({ course, stats }) => (
                <div key={course.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    {course.icon && (
                      <LucideIcon
                        className="size-3.5 shrink-0 text-muted-foreground/60"
                        name={course.icon as IconName}
                      />
                    )}
                    <span className="truncate text-sm font-medium">{localize(course.title)}</span>
                    <Badge className={cn('shrink-0 text-[10px]', courseTypeVariants({ type: course.type }))}>
                      {t(`courseType-${course.type}`)}
                    </Badge>
                  </div>

                  <div className="flex shrink-0 items-center gap-6 text-right text-xs text-muted-foreground">
                    <div className="flex w-16 flex-col gap-1">
                      <span className="text-[11px] font-medium text-foreground tabular-nums">{stats.enrollment}</span>
                      <span className="text-[10px]">{t('enrolled')}</span>
                    </div>

                    <div className="flex w-24 flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]">{t('completionRate')}</span>
                        <span className="text-[11px] font-medium text-foreground tabular-nums">
                          {stats.enrollment > 0 ? `${stats.completionRate}%` : '—'}
                        </span>
                      </div>
                      {stats.enrollment > 0 && (
                        <Progress
                          className="h-1"
                          color={
                            stats.completionRate >= 75 ? 'success' : stats.completionRate >= 40 ? 'brand' : 'default'
                          }
                          value={stats.completionRate}
                        />
                      )}
                    </div>

                    <div className="w-20 text-right">
                      {course.type === 'skill' && stats.avgRating !== null ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-medium text-foreground tabular-nums">
                            {'★ '}
                            {stats.avgRating}
                          </span>
                          <span className="text-[10px]">{t('avgRating')}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/50">{'—'}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
