'use client'

import { useMemo } from 'react'

import { ArrowLeftIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import config from '@config/app'
import { type Enum } from '@glore/utils/types'

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
import { type CourseProgress, type Lesson } from '@/lib/data'
import { cn } from '@/lib/utils'

export const CourseFooter = ({
  lessons,
  onNext,
  onPrevious,
  status,
}: {
  lessons?: Lesson[]
  onNext: () => Promise<void>
  onPrevious: () => void
  status?: Enum<CourseProgress>
}) => {
  const { step } = useCourse()
  const { courses } = useSession()
  const t = useTranslations('Courses')

  const lesson = useMemo(() => lessons?.[step], [lessons, step])
  const isFirstLesson = useMemo(() => step === 0, [step])
  const isLastLesson = useMemo(() => step === (lessons?.length ?? 0) - 1, [lessons?.length, step])

  const canProceed = useMemo(() => {
    if (!lesson) return false
    if (lesson.type === 'reading' || lesson.completed) return true
    if (lesson.type === 'questions') return lesson.questions?.every(q => q.options.some(o => o.isUserAnswer))
    if (lesson.type === 'evaluations') return lesson.evaluations?.every(e => !!e.userRating)
    if (lesson.type === 'assessment') return !!lesson.assessment?.userRating
    return false
  }, [lesson])

  const nextTooltip = useMemo(() => {
    if (!lesson) return
    if (!canProceed) return t('replyToProceed', { type: lesson.type })
  }, [canProceed, lesson, t])

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
    <div className={cn('mt-6 flex', isFirstLesson ? 'justify-end' : 'justify-between')}>
      {!isFirstLesson && (
        <Button className="gap-1" disabled={isFirstLesson} onClick={onPrevious} variant="outline">
          <ArrowLeftIcon className="size-4" />
          {t('previous')}
        </Button>
      )}

      {isLastLesson ? (
        canProceed ? (
          <Dialog>
            <DialogTrigger asChild>
              {status === 'completed' ? null : (
                <ConfettiButton
                  className={cn('gap-1')}
                  disabled={!canProceed}
                  effect="fireworks"
                  onClick={onNext}
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
            <TooltipContent arrow={false}>{nextTooltip}</TooltipContent>
          </Tooltip>
        )
      ) : canProceed ? (
        <Button className="gap-1" onClick={() => onNext()} title={t('proceedToNextLesson')} variant="outline">
          {t('next')}
        </Button>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="cursor-not-allowed gap-1" disabled variant="outline">
              {t('next')}
            </Button>
          </TooltipTrigger>
          <TooltipContent arrow={false}>{nextTooltip}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
