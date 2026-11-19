import { useTranslations } from 'next-intl'

import { type SkillCourseRow } from '@/actions/dashboard/core'
import { CourseIcon } from '@/components/features/dashboard/course-icon'
import { LucideIcon } from '@/components/icons/lucide'
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/ui/status-badge'

export const VolunteerCourses = ({
  compass,
  completed,
  courses,
  min,
}: {
  compass: boolean
  completed: number
  courses: SkillCourseRow[]
  min: number
}) => {
  const t = useTranslations('Dashboard.volunteer')
  const tJourney = useTranslations('Dashboard.journey')

  return (
    <Card className="h-full" data-slot="volunteer-courses">
      <CardHeader>
        <CardTitle>{t('coursesTitle')}</CardTitle>
        <CardAction className="type-caption text-fg-2">{t('coursesProgress', { count: completed, min })}</CardAction>
      </CardHeader>
      <ul className="flex flex-col divide-y divide-border-subtle">
        {courses.map(course => (
          <li key={course.slug}>
            <Link
              className="flex min-h-14 items-center gap-3 py-2.5 transition-colors outline-none hover:text-action-text focus-visible:focus-ring"
              href={`/courses/${course.slug}`}
            >
              <CourseIcon className="size-8" icon={course.icon} type="skill" />
              <span className="min-w-0 flex-1 text-sm font-medium text-pretty">{course.title}</span>
              {course.completed && <StatusBadge tone="approved">{t('completed')}</StatusBadge>}
              {!course.completed && course.percent === 0 && <StatusBadge tone="draft">{t('notStarted')}</StatusBadge>}
              {!course.completed && course.percent > 0 && (
                <span className="flex w-24 shrink-0 items-center gap-2">
                  <Progress aria-label={course.title} className="h-1.5" color="brand" value={course.percent} />
                  <span className="type-caption text-fg-2 tabular-nums">
                    {tJourney('path.percent', { percent: course.percent })}
                  </span>
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
        <Link className="inline-flex min-h-8 items-center" href="/courses" variant="primary">
          {t('viewCourses')}
        </Link>
        {compass && (
          <Link className="inline-flex min-h-8 items-center gap-1.5" href="/courses" variant="primary">
            <LucideIcon className="size-4" name="compass" />
            {tJourney('path.compass')}
          </Link>
        )}
      </div>
    </Card>
  )
}
