'use client'

import { BookOpenIcon, CheckCircle2Icon, CircleDashedIcon, PlayIcon, ZapIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { courseIconVariants, courseTypeVariants } from '@/components/features/courses/course-list/type-select'
import { LucideIcon } from '@/components/icons/lucide'
import { useCourses } from '@/components/providers/courses-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { RadialProgress } from '@/components/ui/radial-progress'
import { useI18n } from '@/hooks/use-i18n'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

const CERTIFICATE_REQUIREMENT = 3

export const PersonalProgress = () => {
  const { courses } = useCourses()
  const { localize } = useI18n()
  const t = useTranslations('Dashboard')

  const enrolledCourses = courses.filter(c => c.enrolled)
  const completedCourses = enrolledCourses.filter(c => c.completed)
  const inProgressCourses = enrolledCourses.filter(c => c.progressStatus === 'inProgress')

  const featuredCourse = inProgressCourses[0]
  const remainingCourses = inProgressCourses.slice(1)

  const qualifyingCount = Math.min(completedCourses.length, CERTIFICATE_REQUIREMENT)
  const certificateReady = completedCourses.length >= CERTIFICATE_REQUIREMENT
  const certificateRemaining = Math.max(0, CERTIFICATE_REQUIREMENT - completedCourses.length)
  const certificatePercent = (qualifyingCount / CERTIFICATE_REQUIREMENT) * 100

  const avgPersonalRating = (() => {
    const ratings: number[] = []
    for (const course of courses) {
      if (course.type === 'skill') {
        for (const lesson of course.lessons) {
          if (lesson.assessment?.userRating !== undefined) {
            ratings.push(lesson.assessment.userRating)
          }
        }
      }
    }
    return Math.round((ratings.reduce((sum, v) => sum + v, 0) / ratings.length) * 10) / 10
  })()

  const progressStats = [
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
  ]

  if (enrolledCourses.length === 0) return null

  const featuredLessonCount = featuredCourse?.lessons.length ?? 0
  const featuredCompletedLessons = featuredCourse?.lessons.filter(lesson => lesson.completed).length ?? 0
  const featuredCurrentLesson = Math.min(featuredCompletedLessons + 1, featuredLessonCount)

  return (
    <div className="flex flex-col gap-8">
      {featuredCourse && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground">{t('continueLearning')}</h2>
          <Card className="flex-row items-center gap-5 p-5">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-tertiary text-white shadow-sm">
              {featuredCourse.icon ? (
                <LucideIcon className="size-7" name={featuredCourse.icon as IconName} />
              ) : (
                <BookOpenIcon className="size-7" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge
                  className={cn('shrink-0 text-[10px]', courseTypeVariants({ type: featuredCourse.type }))}
                  variant="ghost"
                >
                  {t(`courseType-${featuredCourse.type}`)}
                </Badge>
                <span className="truncate text-xs text-muted-foreground">
                  {t('lessonProgress', { current: featuredCurrentLesson, total: featuredLessonCount })}
                  {featuredCourse.skillGroup && (
                    <span className="before:mx-1.5 before:content-['·']">
                      {localize(featuredCourse.skillGroup.name)}
                    </span>
                  )}
                </span>
              </div>
              <h3 className="truncate text-lg font-semibold">{localize(featuredCourse.title)}</h3>
              <div className="flex items-center gap-3">
                <Progress className="h-2" color="brand" value={featuredCourse.progress} />
                <span className="text-xs font-medium tabular-nums">
                  {featuredCourse.progress}
                  {'%'}
                </span>
              </div>
            </div>
            <Button asChild className="shrink-0" icon={PlayIcon} variant="brand">
              <Link href={`/courses/${featuredCourse.slug}`}>{t('continue')}</Link>
            </Button>
          </Card>
        </section>
      )}

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
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="justify-start lg:col-span-2">
          <CardHeader className="px-4 pt-4 pb-3">
            <CardTitle className="text-sm font-medium">{t('currentCourses')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {remainingCourses.length === 0 ? (
              <p className="px-4 pb-4 text-xs text-muted-foreground/60">{t('noCurrentCourses')}</p>
            ) : (
              <div className="divide-y">
                {remainingCourses.map(course => (
                  <div className="flex items-center gap-4 px-4 py-3" key={course.id}>
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      {course.icon && (
                        <LucideIcon
                          className={cn('size-3.5 shrink-0', courseIconVariants({ type: course.type }))}
                          name={course.icon as IconName}
                        />
                      )}
                      <span className="truncate text-sm font-medium">{localize(course.title)}</span>
                    </div>
                    <div className="flex w-32 shrink-0 flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{t('progress')}</span>
                        <span className="text-[11px] font-medium tabular-nums">
                          {course.progress}
                          {'%'}
                        </span>
                      </div>
                      <Progress color="brand" value={course.progress} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="items-center justify-start gap-4 p-6 text-center">
          <CardTitle className="text-sm font-medium">{t('certificateTitle')}</CardTitle>
          <RadialProgress size={132} strokeWidth={10} value={certificatePercent}>
            <span className="text-3xl font-bold tabular-nums">{qualifyingCount}</span>
            <span className="text-xs text-muted-foreground">
              {'/ '}
              {CERTIFICATE_REQUIREMENT}
            </span>
          </RadialProgress>
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold">{certificateReady ? t('certificateReady') : t('certificateAlmost')}</h3>
            <p className="text-xs text-muted-foreground">
              {certificateReady
                ? t('certificateHelperReady')
                : t('certificateHelperPending', { remaining: certificateRemaining })}
            </p>
          </div>
          <Button className="w-full" disabled={!certificateReady} variant="brand">
            {t('requestCertificate')}
          </Button>
        </Card>
      </div>
    </div>
  )
}
