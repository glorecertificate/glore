import { useTranslations } from 'next-intl'

import { type CourseOverview } from '@/db/queries/learning'

const MIN_RATINGS = 3

export const CourseOverviewMeta = ({ overview }: { overview: CourseOverview }) => {
  const t = useTranslations('Learning.overview')
  const { lessons, rating, skillGroup, type } = overview

  return (
    <ul className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-band-text">
      <li>{t(`type.${type}`)}</li>
      {skillGroup && <li className="before:mr-2 before:content-['·']">{skillGroup.name}</li>}
      <li className="before:mr-2 before:content-['·']">{t('lessonsCount', { count: lessons.length })}</li>
      {rating.average !== null && rating.count >= MIN_RATINGS && (
        <li className="before:mr-2 before:content-['·']">
          {t('rating', { count: rating.count, rating: rating.average })}
        </li>
      )}
    </ul>
  )
}
