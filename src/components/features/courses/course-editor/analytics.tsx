'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { getCourseAnalytics } from '@/actions/courses/analytics'
import { useCourse } from '@/components/features/courses/course-editor/context'
import { LucideIcon } from '@/components/icons/lucide'
import { type IconName } from '@/components/icons/registry'
import { useI18n } from '@/components/providers/i18n'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type CourseAnalyticsStats } from '@/db/queries/course-editing'

const AnalyticsSkeleton = () => (
  <div className="flex flex-col gap-6 p-6">
    <div className="grid grid-cols-2 gap-3">
      <Skeleton className="h-18 rounded-lg" />
      <Skeleton className="h-18 rounded-lg" />
      <Skeleton className="h-18 rounded-lg" />
      <Skeleton className="h-18 rounded-lg" />
    </div>
    <Skeleton className="h-48 rounded-lg" />
  </div>
)

const RatingBar = ({ count, label, max }: { count: number; label: string; max: number }) => (
  <div className="flex items-center gap-2">
    <span className="w-4 shrink-0 text-right text-xs text-muted-foreground">{label}</span>
    <Progress
      className="h-2 flex-1"
      color={count > 0 ? 'brand' : 'default'}
      value={max > 0 ? Math.round((count / max) * 100) : 0}
    />
    <span className="w-6 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{count}</span>
  </div>
)

const AnalyticsContent = ({
  course,
  data,
}: {
  course: ReturnType<typeof useCourse>['course']
  data: CourseAnalyticsStats
}) => {
  const t = useTranslations('Courses')
  const tEditor = useTranslations('Learning.editor')
  const { localize } = useI18n()

  const isSkill = course.type === 'skill'
  const empty = '-'

  const statCards: StatCard[] = [
    { icon: 'users', key: 'enrollments', label: t('analyticsEnrollments'), value: data.enrollmentCount },
    { icon: 'trending-up', key: 'completions', label: t('analyticsCompletions'), value: data.completionCount },
    {
      icon: 'chart-no-axes-column',
      key: 'rate',
      label: t('analyticsCompletionRate'),
      value: `${data.completionRate}%`,
    },
    {
      icon: 'star',
      key: 'rating',
      label: t('analyticsAvgRating'),
      value: data.avgRating === null ? empty : `${data.avgRating} / 5`,
    },
    ...(isSkill
      ? ([
          {
            icon: 'star',
            key: 'selfAssessment',
            label: tEditor('analyticsSelfAssessment'),
            value: data.avgSelfAssessment === null ? empty : `${data.avgSelfAssessment} / 5`,
          },
        ] satisfies StatCard[])
      : []),
  ]

  const maxRatingCount = Math.max(...data.ratingDistribution.map(r => r.count), 1)

  if (data.enrollmentCount === 0) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <p className="text-sm text-muted-foreground">{t('analyticsNoData')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(({ icon, key, label, value }) => (
          <Card key={key}>
            <CardHeader className="p-3 pb-1.5">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium">{label}</CardDescription>
                <LucideIcon name={icon} className="size-3 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-3">
              <p className="text-2xl font-bold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.lessonStats.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-medium text-muted-foreground">{t('analyticsLessons')}</h3>
          <div className="flex flex-col divide-y rounded-lg border">
            {data.lessonStats.map((lesson, idx) => (
              <div className="flex items-center gap-3 px-3 py-2.5" key={lesson.id}>
                <span className="w-4 shrink-0 text-xs text-muted-foreground tabular-nums">{idx + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {lesson.title ? localize(lesson.title) : tEditor('analyticsLessonFallback', { number: idx + 1 })}
                </span>
                <div className="flex w-28 shrink-0 flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{lesson.completionCount}</span>
                    <span className="text-[11px] font-medium tabular-nums">{`${lesson.completionRate}%`}</span>
                  </div>
                  <Progress
                    className="h-1"
                    color={lesson.completionRate >= 75 ? 'success' : lesson.completionRate >= 40 ? 'brand' : 'default'}
                    value={lesson.completionRate}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-medium text-muted-foreground">
          {`${t('analyticsRatingDistribution')} (${data.ratingCount})`}
        </h3>
        <div className="flex flex-col gap-2 rounded-lg border p-3">
          {[...data.ratingDistribution].reverse().map(({ count: c, value }) => (
            <RatingBar count={c} key={value} label={String(value)} max={maxRatingCount} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface StatCard {
  icon: IconName
  key: string
  label: string
  value: number | string
}

export const CourseAnalyticsSheet = () => {
  const { course } = useCourse()
  const t = useTranslations('Courses')
  const tEditor = useTranslations('Learning.editor')

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [data, setData] = useState<CourseAnalyticsStats | null>(null)

  const load = async () => {
    setLoading(true)
    setFailed(false)
    const result = await getCourseAnalytics(course.id)
    if (result.data) setData(result.data)
    if (result.error) setFailed(true)
    setLoading(false)
  }

  const handleOpen = async () => {
    setOpen(true)
    if (data) return
    await load()
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button aria-label={t('analyticsSheet')} onClick={handleOpen} size="xs" variant="outline">
            <LucideIcon name="chart-no-axes-column" className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-72 text-center" sideOffset={6}>
          {t('analyticsSheet')}
        </TooltipContent>
      </Tooltip>
      <Sheet onOpenChange={setOpen} open={open}>
        <SheetContent className="flex flex-col gap-0 overflow-y-auto p-0" side="right">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <LucideIcon name="chart-no-axes-column" className="size-4" />
              {t('analyticsSheet')}
            </SheetTitle>
            <SheetDescription className="text-xs">{t('analyticsSheetDescription')}</SheetDescription>
          </SheetHeader>
          {loading && <AnalyticsSkeleton />}
          {!loading && failed && (
            <Banner className="m-6" role="alert" variant="destructive">
              <div className="flex flex-col gap-3">
                <p>{tEditor('analyticsError')}</p>
                <Button className="self-start" onClick={load} size="sm" variant="outline">
                  {tEditor('analyticsRetry')}
                </Button>
              </div>
            </Banner>
          )}
          {!loading && !failed && data && <AnalyticsContent course={course} data={data} />}
        </SheetContent>
      </Sheet>
    </>
  )
}
