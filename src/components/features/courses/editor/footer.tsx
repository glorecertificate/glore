'use client'

import { useCallback, useMemo, useState } from 'react'

import { ArrowLeftIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { completeLesson, submitAssessmentRating, submitEvaluationRatings } from '@/actions/course'
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
import { useSession } from '@/hooks/use-session'
import { cn } from '@/lib/utils'
import settings from '~/config/app.json'

const confettiOptions = {
  zIndex: 100,
}

export const CourseFooter = () => {
  const t = useTranslations('Courses')
  const { course, currentLesson, next, previous, setCourse } = useCourse()
  const { user } = useSession()
  const [saving, setSaving] = useState(false)
  const isViewer = user.isOrgAdmin || user.isRepresentative || user.isTutor

  const isFirst = course.lessons.findIndex(lesson => lesson.id === currentLesson.id) === 0
  const isLast = course.lessons.findIndex(lesson => lesson.id === currentLesson.id) === course.lessons.length - 1

  const canProceed = useMemo(() => {
    if (isViewer) return true
    switch (currentLesson.type) {
      case 'reading':
        return true
      case 'questions':
        return currentLesson.questions?.every(q => q.options.some(o => o.isUserAnswer)) ?? false
      case 'evaluations':
        return currentLesson.evaluations?.every(e => !!e.userRating) ?? false
      case 'assessment':
        return !!currentLesson.assessment?.userRating
      default:
        return false
    }
  }, [currentLesson, isViewer])

  const nextTooltip = useMemo(() => {
    if (currentLesson.type && !canProceed) {
      return t('replyToProceed', { type: currentLesson.type })
    }
  }, [canProceed, currentLesson.type, t])

  const handleAdvance = useCallback(async () => {
    if (!user.canEdit && !isViewer && currentLesson.id && !currentLesson.completed) {
      setSaving(true)
      try {
        if (currentLesson.type === 'evaluations' && currentLesson.evaluations?.length) {
          const ratings = currentLesson.evaluations
            .filter(e => e.userRating !== null && e.userRating !== undefined)
            .map(e => ({ evaluationId: e.id, value: e.userRating! }))
          if (ratings.length > 0) await submitEvaluationRatings(ratings)
        }
        if (
          currentLesson.type === 'assessment' &&
          currentLesson.assessment?.userRating !== null &&
          currentLesson.assessment?.userRating !== undefined
        ) {
          await submitAssessmentRating(currentLesson.assessment.id, currentLesson.assessment.userRating)
        }
        await completeLesson(currentLesson.id)
        setCourse(prev => ({
          ...prev,
          lessons: prev.lessons.map(l => (l.id === currentLesson.id ? { ...l, completed: true } : l)),
        }))
      } finally {
        setSaving(false)
      }
    }
    next()
  }, [currentLesson, isViewer, next, setCourse, user.canEdit])

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
        user.canEdit || isViewer ? null : canProceed ? (
          <Dialog>
            <DialogTrigger asChild>
              {currentLesson.completed ? null : (
                <ConfettiButton
                  className={cn('gap-1')}
                  disabled={!canProceed || saving}
                  effect="fireworks"
                  onClick={handleAdvance}
                  options={confettiOptions}
                  variant="outline"
                >
                  {t('completeCourse')}
                </ConfettiButton>
              )}
            </DialogTrigger>
            <DialogContent className="px-8 sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="mt-3 flex gap-2 text-lg font-medium">
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
        <Button
          className="gap-1"
          disabled={saving}
          onClick={handleAdvance}
          title={t('proceedToNextLesson')}
          variant="outline"
        >
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
