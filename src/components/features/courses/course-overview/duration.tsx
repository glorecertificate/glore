import { useTranslations } from 'next-intl'

import { splitDuration } from '@/components/features/courses/duration'

export const CourseDuration = ({ minutes }: { minutes: number }) => {
  const t = useTranslations('Learning.overview')
  const { hours, minutes: rest } = splitDuration(minutes)
  if (hours === 0) return t('minutes', { minutes: rest })
  if (rest === 0) return t('hours', { hours })
  return t('hoursMinutes', { hours, minutes: rest })
}
