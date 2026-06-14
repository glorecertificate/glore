'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

import { BookOpenIcon, GraduationCapIcon, LibraryIcon, PlayIcon, PlusIcon, TrendingUpIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'

import { useCourses } from '@/components/features/courses/context'
import { CourseAnalytics } from '@/components/features/dashboard/analytics'
import { PersonalProgress } from '@/components/features/dashboard/progress'
import { useI18n } from '@/components/providers/i18n'
import { useSession } from '@/components/providers/session'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type GlobeColorOptions } from '@/components/ui/globe'
import { Link } from '@/components/ui/link'
import { Sparkline } from '@/components/ui/sparkline'
import { useTheme } from '@/hooks/use-theme'
import { cn, hexToRgb } from '@/lib/utils'
import theme from '~/config/theme.json'

const Globe = dynamic(async () => (await import('@/components/ui/globe')).Globe, { ssr: false })

type StatTone = 'brand' | 'success' | 'warning'

const STAT_CHIP: Record<StatTone, string> = {
  brand: 'bg-brand/10 text-brand',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning-accent',
}

const STAT_SPARK: Record<StatTone, string> = {
  brand: 'text-brand',
  success: 'text-success',
  warning: 'text-warning-accent',
}

const TREND_BUCKETS = 8

const monthsBefore = (now: number, months: number) => {
  const date = new Date(now)
  date.setMonth(date.getMonth() - months)
  return date.getTime()
}

const buildTrend = (timestamps: number[], windowMonths: number, now: number) => {
  const start = monthsBefore(now, windowMonths)
  const sorted = timestamps.toSorted((a, b) => a - b)
  const countAt = (at: number) => sorted.filter(time => time <= at).length
  const step = (now - start) / (TREND_BUCKETS - 1)
  const data = Array.from({ length: TREND_BUCKETS }, (_, index) => countAt(start + step * index))
  const baseline = data[0]
  const delta = data[data.length - 1] - baseline
  return { data, delta, ratio: baseline > 0 ? delta / baseline : null }
}

export const DashboardContent = () => {
  const { organization, user } = useSession()
  const { courses } = useCourses()
  const { localize } = useI18n()
  const { resolvedTheme } = useTheme()
  const format = useFormatter()
  const t = useTranslations('Dashboard')

  const globeColors = hexToRgb(theme.colors[resolvedTheme ?? 'light'])
  const globeColorOptions: GlobeColorOptions = { baseColor: globeColors.brand, glowColor: globeColors.background }

  const hour = new Date().getHours()

  const greetingKey = hour < 12 ? 'greetingMorning' : hour < 18 ? 'greetingAfternoon' : 'greetingEvening'

  const subtitleKey = (() => {
    if (user.isAdmin) return 'subtitleAdmin'
    if (user.canEdit) return 'subtitleEditor'
    if (user.isOrgAdmin) return 'subtitleOrgAdmin'
    if (user.isRepresentative) return 'subtitleRepresentative'
    if (user.isTutor) return 'subtitleTutor'
    if (user.isVolunteer) return 'subtitleVolunteer'
    return 'subtitleLearner'
  })()

  const publishedCourses = courses.filter(c => c.publicationStatus === 'published')

  const totalLessons = publishedCourses.reduce((sum, c) => sum + c.lessons.length, 0)

  const nonArchivedCourses = courses.filter(c => c.publicationStatus !== 'archived')

  const resumeCourse = courses.find(c => c.enrolled && c.progressStatus === 'inProgress')

  const [now] = useState(() => Date.now())

  const heroAction = user.canEdit
    ? { icon: PlusIcon, label: t('newCourse') }
    : { icon: PlayIcon, label: t('resumeLearning') }

  const stats = [
    {
      icon: BookOpenIcon,
      key: 'publishedCourses',
      label: t('publishedCourses'),
      period: t('trendPeriod6Months'),
      tone: 'brand',
      trend: buildTrend(
        publishedCourses.map(c => new Date(c.createdAt).getTime()),
        6,
        now
      ),
      value: publishedCourses.length,
    },
    {
      icon: GraduationCapIcon,
      key: 'totalLessons',
      label: t('totalLessons'),
      period: t('trendPeriod1Month'),
      tone: 'success',
      trend: buildTrend(
        publishedCourses.flatMap(c => c.lessons.flatMap(l => (l.createdAt ? [new Date(l.createdAt).getTime()] : []))),
        1,
        now
      ),
      value: totalLessons,
    },
    {
      icon: LibraryIcon,
      key: 'allCourses',
      label: t('allCourses'),
      period: t('trendPeriod3Months'),
      tone: 'warning',
      trend: buildTrend(
        nonArchivedCourses.map(c => new Date(c.createdAt).getTime()),
        3,
        now
      ),
      value: nonArchivedCourses.length,
    },
  ] satisfies {
    icon: typeof BookOpenIcon
    key: string
    label: string
    period: string
    tone: StatTone
    trend: ReturnType<typeof buildTrend>
    value: number
  }[]

  const courseTypes = [
    {
      cardClass: 'border-info/30 bg-info/5',
      countClass: 'text-info',
      courses: publishedCourses.filter(c => c.type === 'intro'),
      key: 'intro',
      label: t('introductoryCourses'),
    },
    {
      cardClass: 'border-brand/30 bg-brand/5',
      countClass: 'text-brand',
      courses: publishedCourses.filter(c => c.type === 'skill'),
      key: 'skill',
      label: t('skillCourses'),
    },
    {
      cardClass: 'border-success/30 bg-success/5',
      countClass: 'text-success',
      courses: publishedCourses.filter(c => c.type === 'learner'),
      key: 'learner',
      label: t('learnerCourses'),
    },
  ]

  return (
    <div className="flex flex-col gap-8 pt-6 pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-brand/8 via-card to-card p-6 shadow-2xs sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-20 opacity-25 select-none sm:-top-28 sm:-right-24 sm:opacity-30"
        >
          <Globe className="size-80 sm:size-112" {...globeColorOptions} />
        </div>
        <div className="relative z-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{t(greetingKey, { name: user.firstName })}</h1>
            <p className="text-[15px] text-muted-foreground">
              {t(subtitleKey)}
              {organization && (
                <span className="text-foreground/60 before:mx-1.5 before:content-['·']">{organization.name}</span>
              )}
            </p>
          </div>
          <Button asChild className="shrink-0" icon={heroAction.icon} variant="brand">
            <Link href={user.canEdit ? '/courses' : resumeCourse ? `/courses/${resumeCourse.slug}` : '/courses'}>
              {heroAction.label}
            </Link>
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ icon: Icon, key, label, period, tone, trend, value }) => {
          const positive = trend.ratio === null ? trend.delta > 0 : trend.ratio > 0
          const trendLabel = positive
            ? trend.ratio === null
              ? format.number(trend.delta, { signDisplay: 'always' })
              : format.number(trend.ratio, { maximumFractionDigits: 1, signDisplay: 'exceptZero', style: 'percent' })
            : format.number(0, { style: 'percent' })

          return (
            <Card className="justify-start gap-4 p-5" key={key}>
              <div className="flex items-center justify-between gap-2">
                <div className={cn('flex size-9 items-center justify-center rounded-lg', STAT_CHIP[tone])}>
                  <Icon className="size-4.5" />
                </div>
                <Sparkline className={STAT_SPARK[tone]} data={trend.data} />
              </div>
              <div className="flex flex-col gap-1.5">
                <CardDescription className="text-xs font-medium">{label}</CardDescription>
                <div className="flex items-end gap-2">
                  <span className="text-[32px] leading-none font-bold tabular-nums">{value}</span>
                  <span
                    className={cn(
                      'mb-0.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium',
                      positive ? 'bg-success/12 text-success-accent' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {positive && <TrendingUpIcon className="size-3" />}
                    {trendLabel}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground/70">{period}</span>
              </div>
            </Card>
          )
        })}
      </section>

      {publishedCourses.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground">{t('coursesByType')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {courseTypes.map(({ cardClass, countClass, courses: typeCourses, key, label }) => (
              <Card className={cn(cardClass)} key={key}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-medium">{label}</CardTitle>
                    <span className={cn('text-2xl font-bold tabular-nums', countClass)}>{typeCourses.length}</span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pt-0 pb-4">
                  {typeCourses.length === 0 ? (
                    <p className="text-xs text-muted-foreground/60">{t('noCoursesMessage')}</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {typeCourses.slice(0, 3).map(course => (
                        <li className="truncate text-xs text-muted-foreground" key={course.id}>
                          {localize(course.title)}
                        </li>
                      ))}
                      {typeCourses.length > 3 && (
                        <li className="text-xs text-muted-foreground/50">
                          {'+'}
                          {typeCourses.length - 3} {t('moreCourses')}
                        </li>
                      )}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {user.canEdit ? <CourseAnalytics /> : <PersonalProgress />}
    </div>
  )
}
