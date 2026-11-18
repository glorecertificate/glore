'use client'

import { type Route } from 'next'

import { useTranslations } from 'next-intl'

import { type MemberSummary } from '@/actions/dashboard/core'
import { DashboardChecklist } from '@/components/features/dashboard/checklist'
import { CourseRow } from '@/components/features/dashboard/course-row'
import { DashboardEmpty } from '@/components/features/dashboard/empty'
import { DashboardHero } from '@/components/features/dashboard/hero'
import { DashboardSection, StatLink } from '@/components/features/dashboard/section'
import { NotificationList } from '@/components/features/notifications/notification-list'
import { Card, CardContent } from '@/components/ui/card'
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
        organization={organization}
        subtitle={t('subtitle.learner')}
        title={t('greeting', { name: firstName })}
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
        <StatLink accent="teal" href="/courses" icon="book-open" label={t('stats.enrolled')} value={courses.enrolled} />
        <StatLink accent="amber" href="/courses" icon="play" label={t('stats.inProgress')} value={courses.inProgress} />
        <StatLink
          accent="green"
          href="/courses"
          icon="circle-check"
          label={t('stats.completed')}
          value={courses.completed}
        />
        <StatLink accent="navy" href="/courses" icon="library" label={t('stats.available')} value={courses.available} />
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <DashboardSection action={{ href: '/courses', label: t('viewCourses') }} title={t('continue.title')}>
          {courses.continuing.length === 0 ? (
            <DashboardEmpty
              className="border"
              description={t('continue.emptyDescription')}
              icon="book-open"
              title={t('continue.emptyTitle')}
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {courses.continuing.map(course => (
                <li key={course.slug}>
                  <CourseRow icon={course.icon} slug={course.slug} title={course.title} type={course.type}>
                    <span className="flex items-center gap-2">
                      <Progress aria-label={course.title} className="h-1.5" color="brand" value={course.percent} />
                      <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums">
                        {t('continue.percent', { percent: course.percent })}
                      </span>
                    </span>
                  </CourseRow>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>

        <DashboardSection title={t('recommended.title')}>
          {courses.recommendations.length === 0 ? (
            <DashboardEmpty
              className="border"
              description={t('recommended.emptyDescription')}
              icon="sparkles"
              title={t('recommended.emptyTitle')}
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {courses.recommendations.map(course => (
                <li key={course.slug}>
                  <CourseRow icon={course.icon} slug={course.slug} title={course.title} type={course.type}>
                    <span className="text-xs text-muted-foreground">
                      {course.goal ? t('recommended.goal') : t(`recommended.type.${course.type}`)}
                    </span>
                  </CourseRow>
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
              <DashboardEmpty icon="bell-off" title={t('updates.empty')} />
            ) : (
              <NotificationList notifications={notifications} />
            )}
          </CardContent>
        </Card>
      </DashboardSection>
    </div>
  )
}
