'use client'

import { useMemo } from 'react'

import { BookOpenIcon, CheckCircle2Icon, CircleDashedIcon, ZapIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { useCourses } from '@/components/providers/courses-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useI18n } from '@/hooks/use-i18n'
import { type IconName } from '@/lib/types'

export const PersonalProgress = () => {
  const { courses } = useCourses()
  const { localize } = useI18n()
  const t = useTranslations('Dashboard')

  const enrolledCourses = useMemo(() => courses.filter(c => c.enrolled), [courses])
  const completedCourses = useMemo(() => enrolledCourses.filter(c => c.completed), [enrolledCourses])
  const inProgressCourses = useMemo(
    () => enrolledCourses.filter(c => c.progressStatus === 'inProgress'),
    [enrolledCourses]
  )

  const avgPersonalRating = useMemo(() => {
    const ratings = courses
      .filter(c => c.type === 'skill')
      .flatMap(c => c.lessons.filter(l => l.assessment?.userRating !== undefined).map(l => l.assessment!.userRating!))
    if (!ratings.length) return null
    return Math.round((ratings.reduce((sum, v) => sum + v, 0) / ratings.length) * 10) / 10
  }, [courses])

  const progressStats = useMemo(
    () => [
      {
        icon: BookOpenIcon,
        key: 'enrolled',
        label: t('enrolledCourses'),
        value: enrolledCourses.length,
      },
      {
        icon: CheckCircle2Icon,
        key: 'completed',
        label: t('completedCourses'),
        value: completedCourses.length,
      },
      {
        icon: CircleDashedIcon,
        key: 'inProgress',
        label: t('inProgressCourses'),
        value: inProgressCourses.length,
      },
      {
        icon: ZapIcon,
        key: 'avgRating',
        label: t('avgPersonalRating'),
        value: avgPersonalRating ? `${avgPersonalRating} / 5` : '—',
      },
    ],
    [avgPersonalRating, completedCourses.length, enrolledCourses.length, inProgressCourses.length, t]
  )

  if (enrolledCourses.length === 0) return null

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-muted-foreground">{t('yourProgress')}</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {progressStats.map(({ icon: Icon, key, label, value }) => (
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

      {inProgressCourses.length > 0 && (
        <Card>
          <CardHeader className="px-4 pt-4 pb-3">
            <CardTitle className="text-sm font-medium">{t('currentCourses')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {inProgressCourses.map(course => (
                <div key={course.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    {course.icon && (
                      <LucideIcon
                        className="size-3.5 shrink-0 text-muted-foreground/60"
                        name={course.icon as IconName}
                      />
                    )}
                    <span className="truncate text-sm font-medium">{localize(course.title)}</span>
                  </div>
                  <div className="flex w-32 shrink-0 flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{t('progress')}</span>
                      <span className="text-[11px] font-medium tabular-nums">{course.progress}%</span>
                    </div>
                    <Progress color="brand" value={course.progress} />
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
