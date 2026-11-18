import { useTranslations } from 'next-intl'

import { CourseDuration } from '@/components/features/courses/course-overview/duration'
import { LucideIcon } from '@/components/icons/lucide'
import { type CourseOverview } from '@/db/queries/learning'
import { type IconName } from '@/lib/types'

const CHIP =
  'inline-flex items-center rounded-full bg-band-scrim px-2.5 py-0.5 text-xs font-medium text-band-foreground'

export const CourseOverviewMeta = ({ overview }: { overview: CourseOverview }) => {
  const t = useTranslations('Learning.overview')
  const { durationMinutes, icon, lessons, rating, skillGroup, type } = overview

  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-band-text">
      <li className="flex size-8 items-center justify-center rounded-full bg-band-scrim text-band-foreground">
        <LucideIcon aria-hidden className="size-4" name={(icon ?? 'book-open') as IconName} />
      </li>
      <li className={CHIP}>{t(`type.${type}`)}</li>
      {skillGroup && <li className={CHIP}>{skillGroup.name}</li>}
      {durationMinutes ? (
        <li className="flex items-center gap-1.5">
          <LucideIcon aria-hidden className="size-4" name="clock" />
          <CourseDuration minutes={durationMinutes} />
        </li>
      ) : null}
      <li className="flex items-center gap-1.5">
        <LucideIcon aria-hidden className="size-4" name="book-open" />
        {t('lessonsCount', { count: lessons.length })}
      </li>
      {rating.average !== null && (
        <li className="flex items-center gap-1.5">
          <LucideIcon aria-hidden className="size-4" name="star" />
          {t('rating', { count: rating.count, rating: rating.average })}
        </li>
      )}
    </ul>
  )
}
