'use client'

import { useMemo } from 'react'

import { ArrowLeftIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import settings from '~/config/settings.json'

import { useCourse } from '@/components/features/courses/editor/context'
import { Button } from '@/components/ui/button'
import { ConfettiButton } from '@/components/ui/confetti'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Link } from '@/components/ui/link'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export const CourseFooter = () => {
  const t = useTranslations('Courses')
  const { course, currentLesson, next, previous } = useCourse()

  const isFirst = course.lessons.findIndex(lesson => lesson.id === currentLesson.id) === 0
  const isLast = course.lessons.findIndex(lesson => lesson.id === currentLesson.id) === course.lessons.length - 1

  const canProceed = useMemo(() => {
    if (!currentLesson) return false
    if (currentLesson.type === 'reading' || currentLesson.completed) return true
    if (currentLesson.type === 'questions')
      return currentLesson.questions?.every(q => q.options.some(o => o.isUserAnswer))
    if (currentLesson.type === 'evaluations') return currentLesson.evaluations?.every(e => !!e.userRating)
    if (currentLesson.type === 'assessment') return !!currentLesson.assessment?.userRating
    return false
  }, [currentLesson])

  const nextTooltip = useMemo(() => {
    if (currentLesson.type && !canProceed) {
      return t('replyToProceed', { type: currentLesson.type })
    }
  }, [canProceed, currentLesson.type, t])

  const completedCount = course.lessons.filter(({ completed }) => completed).length
  const completedTitle =
    completedCount === course.lessons.length ? t('completedTitleAll') : t('completedTitle', { count: completedCount })
  const completedMessage =
    completedCount < 3
      ? t('completedMessage')
      : completedCount === settings.minSkills
        ? t('completedRequestCertificate')
        : t('completeIncludeInCertificate')

  return (
    <div className={cn('mt-6 flex', isFirst ? 'justify-end' : 'justify-between')}>
      {!isFirst && (
        <Button className="gap-1" disabled={isFirst} onClick={previous} variant="outline">
          <ArrowLeftIcon className="size-4" />
          {t('previous')}
        </Button>
      )}

      {isLast ? (
        canProceed ? (
          <Dialog>
            <DialogTrigger asChild>
              {currentLesson.completed ? null : (
                <ConfettiButton
                  className={cn('gap-1')}
                  disabled={!canProceed}
                  effect="fireworks"
                  onClick={next}
                  options={{ zIndex: 100 }}
                  variant="outline"
                >
                  {t('completeCourse')}
                </ConfettiButton>
              )}
            </DialogTrigger>
            <DialogContent className="px-8 sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="mt-3 flex gap-2 font-medium text-lg">
                  {completedTitle}
                  {' 🎉'}
                </DialogTitle>
              </DialogHeader>
              <p className="mt-2 mb-1.5 text-[15px] text-foreground/80">{completedMessage}</p>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{t('reviewCourse')}</Button>
                </DialogClose>
                {completedCount < 3 && (
                  <Button asChild variant="outline">
                    <Link href="/courses">{t('backTo')}</Link>
                  </Button>
                )}
                {completedCount === settings.minSkills && (
                  <Button asChild variant="brand-secondary">
                    <Link href="/certificates/new">{t('requestCertificate')}</Link>
                  </Button>
                )}
                {completedCount > settings.minSkills && (
                  <Button asChild variant="outline">
                    <Link href="/certificates">{t('goToCertificate')}</Link>
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="cursor-not-allowed gap-1" disabled variant="outline">
                {t('completeCourse')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{nextTooltip}</TooltipContent>
          </Tooltip>
        )
      ) : canProceed ? (
        <Button className="gap-1" onClick={() => next()} title={t('proceedToNextLesson')} variant="outline">
          {t('next')}
        </Button>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="cursor-not-allowed gap-1" disabled variant="outline">
              {t('next')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{nextTooltip}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
