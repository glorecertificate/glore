'use client'

import { type Locale, useTranslations } from 'next-intl'

import { resolveCourseLanguage, useCourseLanguages } from '@/components/features/courses/course-languages'
import { useCourseListSearch } from '@/components/features/courses/course-list/use-params'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { useSession } from '@/components/providers/session'
import { Card } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { Progress } from '@/components/ui/progress'
import { SearchHighlight } from '@/components/ui/search'
import { StatusBadge } from '@/components/ui/status-badge'
import { type CourseSummary } from '@/db/queries/course'
import { localizeRecord } from '@/lib/i18n'

const STATUS_TONES = { completed: 'success', inProgress: 'info', notStarted: 'neutral' } as const

export const LearnerCourseCard = ({
  activeLanguages,
  course,
  prefetch = false,
}: {
  activeLanguages: Locale[]
  course: CourseSummary
  prefetch?: boolean
}) => {
  const t = useTranslations('CourseList')
  const { user } = useSession()
  const { locale } = useI18n()
  const { search } = useCourseListSearch()
  const { languages } = useCourseLanguages()

  const language = resolveCourseLanguage(languages, course.id, { activeLanguages, fallback: locale })
  const title = localizeRecord(course.title, language)
  const description = course.description ? localizeRecord(course.description, language) : undefined
  const href = `/courses/${course.slug}?lang=${language}` as const
  const isViewer = user.isOrgAdmin || user.isRepresentative || user.isTutor
  const inProgress = course.enrolled && course.progressStatus === 'inProgress'
  const label = (() => {
    if (isViewer) return t('viewCourse')
    if (!course.enrolled) return t('startCourse')
    if (course.completed) return t('reviewCourse')
    return t('continueCourse')
  })()

  return (
    <Card className="relative h-full justify-between gap-4 p-5 transition-[border-color,box-shadow] duration-150 hover:border-border-strong hover:shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate type-label text-muted-foreground">
            {course.skillGroup ? localizeRecord(course.skillGroup.name, language) : null}
          </span>
          {!isViewer && course.enrolled && (
            <StatusBadge className="shrink-0" tone={STATUS_TONES[course.progressStatus]}>
              {t(course.progressStatus)}
            </StatusBadge>
          )}
        </div>
        <h3 className="type-heading">
          <Link
            className="after:absolute after:inset-0 after:content-['']"
            href={href}
            prefetch={prefetch ? true : undefined}
            suppressHydrationWarning
          >
            <SearchHighlight query={search} value={title} />
          </Link>
        </h3>
        {description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            <SearchHighlight query={search} value={description} />
          </p>
        )}
      </div>
      {inProgress && (
        <Progress aria-label={t('inProgress')} className="h-1.5 bg-muted" color="brand" value={course.progress} />
      )}
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <LucideIcon aria-hidden className="size-3.5" name="book-open" />
            {course.lessonCount > 0
              ? `${course.lessonCount} ${t('lessons', { count: course.lessonCount })}`
              : t('noLessonsCreated')}
          </span>
        </span>
        <span className="shrink-0 font-medium text-action-text">{label}</span>
      </div>
    </Card>
  )
}
