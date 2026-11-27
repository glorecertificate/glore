import { useTranslations } from 'next-intl'

import { DashboardHeader } from '@/components/layout/dashboard-header'
import { type CourseOverview } from '@/db/queries/learning'

export const CourseCompleteHeader = ({ overview }: { overview: CourseOverview }) => {
  const t = useTranslations('Learning.complete')

  return (
    <DashboardHeader
      description={t('subtitle', { course: overview.title })}
      parent="courses"
      title={t('title')}
      width="prose"
    />
  )
}
