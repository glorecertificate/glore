'use client'

import { useMemo } from 'react'

import { ArrowLeftIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import config from '@config/app'

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
import { useCourse } from '@/hooks/use-course'
import { useSession } from '@/hooks/use-session'
import { cn } from '@/lib/utils'

export const CourseFooter = () => {
  const { currentLesson, moveNext, movePrevious } = useCourse()
  const { courses } = useSession()
  const t = useTranslations('Courses')

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
    if (!currentLesson.type) return
    if (!canProceed) return t('replyToProceed', { type: currentLesson.type })
  }, [canProceed, currentLesson, t])

  const completedCount = useMemo(() => courses.filter(m => m.completed).length, [courses])

  const completedTitle = useMemo(
    () => (completedCount === courses.length ? t('completedTitleAll') : t('completedTitle', { count: completedCount })),
    [completedCount, courses.length, t]
  )

  const completedMessage = useMemo(
    () =>
      completedCount < 3
        ? t('completedMessage')
        : completedCount === config.minSkills
          ? t('completedRequestCertificate')
          : t('completeIncludeInCertificate'),
    [completedCount, t]
  )

  return (
    <div className={cn('mt-6 flex', currentLesson.isFirst ? 'justify-end' : 'justify-between')}>
      {!currentLesson.isFirst && (
        <Button className="gap-1" disabled={currentLesson.isFirst} onClick={movePrevious} variant="outline">
          <ArrowLeftIcon className="size-4" />
          {t('previous')}
        </Button>
      )}

      {currentLesson.isLast ? (
        canProceed ? (
          <Dialog>
            <DialogTrigger asChild>
              {currentLesson.completed ? null : (
                <ConfettiButton
                  className={cn('gap-1')}
                  disabled={!canProceed}
                  effect="fireworks"
                  onClick={moveNext}
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
                {completedCount === config.minSkills && (
                  <Button asChild variant="brand-secondary">
                    <Link href="/certificates/new">{t('requestCertificate')}</Link>
                  </Button>
                )}
                {completedCount > config.minSkills && (
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
        <Button className="gap-1" onClick={() => moveNext()} title={t('proceedToNextLesson')} variant="outline">
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
