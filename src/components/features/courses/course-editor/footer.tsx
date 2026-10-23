'use client'

import { useTranslations } from 'next-intl'

import { useCourse } from '@/components/features/courses/course-editor/context'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const CourseFooter = () => {
  const t = useTranslations('CourseEditor')
  const { course, currentLesson, next, previous } = useCourse()

  const index = course.lessons.findIndex(lesson => lesson.id === currentLesson.id)
  const isFirst = index === 0
  const isLast = index === course.lessons.length - 1

  return (
    <div className={cn('mt-6 flex', isFirst ? 'justify-end' : 'justify-between')}>
      {!isFirst && (
        <Button className="gap-1" onClick={previous} variant="outline">
          <LucideIcon name="arrow-left" className="size-4" />
          {t('previous')}
        </Button>
      )}
      {!isLast && (
        <Button className="gap-1" onClick={next} title={t('proceedToNextLesson')} variant="outline">
          {t('next')}
        </Button>
      )}
    </div>
  )
}
