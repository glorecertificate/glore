'use client'

import { memo, useCallback, useMemo } from 'react'

import { ClipboardListIcon, MessageCircleQuestionIcon, PlusIcon, StarIcon, TrashIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useCourse } from '@/components/features/courses/editor/context'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { type Assessment, type Evaluation, type Question } from '@/db/queries/lesson'
import { useSession } from '@/hooks/use-session'
import { type IntlRecord, i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type ExtraType = 'questions' | 'evaluation' | 'assessment'

const emptyIntlRecord = () => i18n.locales.reduce((acc, locale) => ({ ...acc, [locale]: '' }), {} as IntlRecord)

const ExtraItem = memo(
  ({
    description,
    label,
    language,
    onDescriptionChange,
    onRemove,
  }: {
    description: string
    label: string
    language: string
    onDescriptionChange: (value: string) => void
    onRemove: () => void
  }) => {
    const t = useTranslations('Courses')

    return (
      <div className="group flex items-start gap-2">
        <div className="flex-1 space-y-1">
          <p className="font-medium text-muted-foreground text-xs">{label}</p>
          <Textarea
            className="min-h-10 text-sm"
            onChange={e => onDescriptionChange(e.target.value)}
            placeholder={t('extraDescriptionPlaceholder', { lang: language })}
            value={description}
          />
        </div>
        <Button
          className="mt-5 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onRemove}
          size="icon"
          variant="ghost"
        >
          <TrashIcon className="size-4 text-destructive" />
        </Button>
      </div>
    )
  }
)

export const LessonExtras = ({ className }: { className?: string }) => {
  const { course, currentLesson, language, setCourse, step } = useCourse()
  const { user } = useSession()
  const t = useTranslations('Courses')

  const isSkillCourse = course.type === 'skill'
  const canEdit = user.canEdit && !course.archived_at

  const hasAssessment = !!currentLesson.assessment

  const addQuestion = useCallback(() => {
    const newQuestion = {
      id: Date.now(),
      description: emptyIntlRecord(),
      explanation: null,
      answered: false,
      options: [],
    } as unknown as Question
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) =>
        i === step - 1 ? { ...lesson, questions: [...lesson.questions, newQuestion] } : lesson
      ),
    }))
  }, [setCourse, step])

  const addEvaluation = useCallback(() => {
    const newEvaluation = {
      id: Date.now() + 1,
      description: emptyIntlRecord(),
      userRating: undefined,
    } as unknown as Evaluation
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) =>
        i === step - 1 ? { ...lesson, evaluations: [...lesson.evaluations, newEvaluation] } : lesson
      ),
    }))
  }, [setCourse, step])

  const addAssessment = useCallback(() => {
    const newAssessment = {
      id: Date.now() + 2,
      description: emptyIntlRecord(),
      userRating: undefined,
      user_assessments: [],
    } as unknown as Assessment
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) => (i === step - 1 ? { ...lesson, assessment: newAssessment } : lesson)),
    }))
  }, [setCourse, step])

  const updateQuestionDescription = useCallback(
    (questionId: number, value: string) => {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map((lesson, i) =>
          i === step - 1
            ? {
                ...lesson,
                questions: lesson.questions.map(q =>
                  q.id === questionId ? { ...q, description: { ...q.description, [language]: value } } : q
                ),
              }
            : lesson
        ),
      }))
    },
    [language, setCourse, step]
  )

  const updateEvaluationDescription = useCallback(
    (evaluationId: number, value: string) => {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map((lesson, i) =>
          i === step - 1
            ? {
                ...lesson,
                evaluations: lesson.evaluations.map(e =>
                  e.id === evaluationId ? { ...e, description: { ...e.description, [language]: value } } : e
                ),
              }
            : lesson
        ),
      }))
    },
    [language, setCourse, step]
  )

  const updateAssessmentDescription = useCallback(
    (value: string) => {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map((lesson, i) =>
          i === step - 1 && lesson.assessment
            ? {
                ...lesson,
                assessment: {
                  ...lesson.assessment,
                  description: { ...lesson.assessment.description, [language]: value },
                },
              }
            : lesson
        ),
      }))
    },
    [language, setCourse, step]
  )

  const removeQuestion = useCallback(
    (questionId: number) => {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map((lesson, i) =>
          i === step - 1 ? { ...lesson, questions: lesson.questions.filter(q => q.id !== questionId) } : lesson
        ),
      }))
    },
    [setCourse, step]
  )

  const removeEvaluation = useCallback(
    (evaluationId: number) => {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map((lesson, i) =>
          i === step - 1 ? { ...lesson, evaluations: lesson.evaluations.filter(e => e.id !== evaluationId) } : lesson
        ),
      }))
    },
    [setCourse, step]
  )

  const removeAssessment = useCallback(() => {
    setCourse(prev => ({
      ...prev,
      lessons: prev.lessons.map((lesson, i) => (i === step - 1 ? { ...lesson, assessment: undefined } : lesson)),
    }))
  }, [setCourse, step])

  const onAddExtra = useCallback(
    (type: ExtraType) => {
      if (type === 'questions') return addQuestion()
      if (type === 'evaluation') return addEvaluation()
      if (type === 'assessment') return addAssessment()
    },
    [addAssessment, addEvaluation, addQuestion]
  )

  const hasExtras = useMemo(
    () => currentLesson.questions.length > 0 || currentLesson.evaluations.length > 0 || !!currentLesson.assessment,
    [currentLesson.assessment, currentLesson.evaluations.length, currentLesson.questions.length]
  )

  if (!(isSkillCourse && canEdit)) return null

  return (
    <div className={cn('space-y-6', className)}>
      {hasExtras && <div className="border-t-2" />}

      {currentLesson.questions.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 font-semibold text-sm">
            <MessageCircleQuestionIcon className="size-4" />
            {t('questionsTitle')}
          </h4>
          <div className="space-y-4">
            {currentLesson.questions.map((question, index) => (
              <ExtraItem
                description={(question.description as IntlRecord)?.[language] ?? ''}
                key={question.id}
                label={`${t('extraQuestion')} ${index + 1}`}
                language={language}
                onDescriptionChange={value => updateQuestionDescription(question.id, value)}
                onRemove={() => removeQuestion(question.id)}
              />
            ))}
          </div>
        </div>
      )}

      {currentLesson.evaluations.length > 0 && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 font-semibold text-sm">
            <ClipboardListIcon className="size-4" />
            {t('subskillEvaluationsTitle')}
          </h4>
          <div className="space-y-4">
            {currentLesson.evaluations.map((evaluation, index) => (
              <ExtraItem
                description={(evaluation.description as IntlRecord)?.[language] ?? ''}
                key={evaluation.id}
                label={`${t('extraEvaluation')} ${index + 1}`}
                language={language}
                onDescriptionChange={value => updateEvaluationDescription(evaluation.id, value)}
                onRemove={() => removeEvaluation(evaluation.id)}
              />
            ))}
          </div>
        </div>
      )}

      {currentLesson.assessment && (
        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 font-semibold text-sm">
            <StarIcon className="size-4" />
            {t('skillEvaluationTitle')}
          </h4>
          <ExtraItem
            description={(currentLesson.assessment.description as IntlRecord)?.[language] ?? ''}
            label={t('extraAssessment')}
            language={language}
            onDescriptionChange={updateAssessmentDescription}
            onRemove={removeAssessment}
          />
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="gap-1.5" size="sm" variant="outline">
            <PlusIcon className="size-4" />
            {t('addExtra')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onAddExtra('questions')}>
            <MessageCircleQuestionIcon className="size-4" />
            {t('addExtraQuestion')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddExtra('evaluation')}>
            <ClipboardListIcon className="size-4" />
            {t('addExtraEvaluation')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={hasAssessment} onClick={() => onAddExtra('assessment')}>
            <StarIcon className="size-4" />
            {t('addExtraAssessment')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
