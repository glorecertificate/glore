import { useTranslations } from 'next-intl'

import { type CourseOverview } from '@/db/queries/learning'

const MIN_RATINGS = 3

const ITEM = "before:inline-block before:w-4 before:text-center before:content-['·']"

export const CourseOverviewMeta = ({ overview }: { overview: CourseOverview }) => {
  const t = useTranslations('Learning.overview')
  const { lessons, rating, skillGroup, type } = overview

  return (
    <div className="overflow-hidden">
      <ul className="-ml-4 flex flex-wrap items-center gap-y-1 text-sm text-band-text">
        <li className={ITEM}>{t(`type.${type}`)}</li>
        {skillGroup && <li className={ITEM}>{skillGroup.name}</li>}
        <li className={ITEM}>{t('lessonsCount', { count: lessons.length })}</li>
        {rating.average !== null && rating.count >= MIN_RATINGS && (
          <li className={ITEM}>{t('rating', { count: rating.count, rating: rating.average })}</li>
        )}
      </ul>
    </div>
  )
}
