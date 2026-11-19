import { useTranslations } from 'next-intl'

import { type CourseCompletionData, CourseNextSteps } from '@/components/features/courses/course-complete'
import { CourseRatingForm } from '@/components/features/courses/course-complete/rating-form'
import { LucideIcon } from '@/components/icons/lucide'
import { Card } from '@/components/ui/card'
import { type CourseOverview } from '@/db/queries/learning'

export const CourseCompletedCard = ({
  completion,
  overview,
}: {
  completion: CourseCompletionData
  overview: CourseOverview
}) => {
  const t = useTranslations('Learning.complete')

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-stat-tile text-stat-foreground stat-accent-green">
            <LucideIcon className="size-5" name="trophy" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="type-heading">{t('summaryTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('lessonsDone', { count: overview.progress.completed })}</p>
          </div>
        </div>
        <CourseRatingForm courseId={overview.id} initial={completion.myRating} />
      </Card>
      <CourseNextSteps completion={completion} overview={overview} />
    </div>
  )
}
