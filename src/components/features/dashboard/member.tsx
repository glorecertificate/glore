'use client'

import { type Route } from 'next'

import { useTranslations } from 'next-intl'

import { type MemberSummary } from '@/actions/dashboard/core'
import { DashboardChecklist } from '@/components/features/dashboard/checklist'
import { CourseIcon } from '@/components/features/dashboard/course-icon'
import { DashboardHero } from '@/components/features/dashboard/hero'
import { DashboardSection, StatLink } from '@/components/features/dashboard/section'
import { NotificationList } from '@/components/features/notifications/notification-list'
import { LucideIcon } from '@/components/icons/lucide'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'

export const MemberDashboard = ({
  firstName,
  member,
  organization,
}: {
  firstName: string
  member: MemberSummary
  organization: string | null
}) => {
  const t = useTranslations('Dashboard')
  const { checklist, courses, notifications } = member
  const [next] = courses.continuing
  const heroAction = next
    ? { href: `/courses/${next.slug}` as Route, label: t('resumeLearning') }
    : { href: '/courses' as Route, label: t('browseCourses') }

  const entries = checklist.map(item => ({
    action: t(`checklist.learner.${item.key}.action` as Parameters<typeof t>[0]),
    description: t(`checklist.learner.${item.key}.description` as Parameters<typeof t>[0]),
    done: item.done,
    href: item.href,
    key: item.key,
    title: t(`checklist.learner.${item.key}.title` as Parameters<typeof t>[0]),
  }))

  return (
    <div className="flex flex-col gap-8">
      <DashboardHero
        action={heroAction}
        name={firstName}
        organization={organization}
        subtitle={t('subtitle.learner')}
      />

      <DashboardChecklist
        entries={entries}
        progress={t('checklist.progress', {
          completed: entries.filter(({ done }) => done).length,
          total: entries.length,
        })}
        title={t('checklist.title')}
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatLink href="/courses" label={t('stats.enrolled')} value={courses.enrolled} />
        <StatLink href="/courses" label={t('stats.inProgress')} value={courses.inProgress} />
        <StatLink href="/courses" label={t('stats.completed')} value={courses.completed} />
        <StatLink href="/courses" label={t('stats.available')} value={courses.available} />
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <DashboardSection action={{ href: '/courses', label: t('viewCourses') }} title={t('continue.title')}>
          {courses.continuing.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('continue.emptyTitle')}</CardTitle>
                <CardDescription>{t('continue.emptyDescription')}</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {courses.continuing.map(course => (
                <li key={course.slug}>
                  <Link
                    className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
                    href={`/courses/${course.slug}` as Route}
                  >
                    <CourseIcon icon={course.icon} type={course.type} />
                    <span className="flex min-w-0 flex-1 flex-col gap-2">
                      <span className="truncate text-sm font-medium">{course.title}</span>
                      <span className="flex items-center gap-2">
                        <Progress aria-label={course.title} className="h-1.5" color="brand" value={course.percent} />
                        <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums">
                          {t('continue.percent', { percent: course.percent })}
                        </span>
                      </span>
                    </span>
                    <LucideIcon name="arrow-right" className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>

        <DashboardSection title={t('recommended.title')}>
          {courses.recommendations.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('recommended.emptyTitle')}</CardTitle>
                <CardDescription>{t('recommended.emptyDescription')}</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {courses.recommendations.map(course => (
                <li key={course.slug}>
                  <Link
                    className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
                    href={`/courses/${course.slug}` as Route}
                  >
                    <CourseIcon icon={course.icon} type={course.type} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{course.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {course.goal ? t('recommended.goal') : t(`recommended.type.${course.type}`)}
                      </span>
                    </span>
                    <LucideIcon name="arrow-right" className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>
      </div>

      <DashboardSection action={{ href: '/notifications', label: t('viewAll') }} title={t('updates.title')}>
        <Card>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('updates.empty')}</p>
            ) : (
              <NotificationList notifications={notifications} />
            )}
          </CardContent>
        </Card>
      </DashboardSection>
    </div>
  )
}
